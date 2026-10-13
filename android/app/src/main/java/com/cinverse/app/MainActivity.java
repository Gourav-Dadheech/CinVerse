package com.cinverse.app;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends AppCompatActivity {

    private static final String APP_URL = "https://cinverse.vexr.dev/";

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private FrameLayout fullscreenContainer;

    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private long backPressedTime = 0;

    private WebView extractorWebView;
    private Runnable extractionTimeoutRunnable;
    private final android.os.Handler mainHandler = new android.os.Handler(android.os.Looper.getMainLooper());

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        swipeRefresh = findViewById(R.id.swipe_refresh);
        progressBar = findViewById(R.id.page_progress);
        fullscreenContainer = findViewById(R.id.fullscreen_container);

        swipeRefresh.setColorSchemeResources(R.color.purple_primary, R.color.emerald_accent);
        swipeRefresh.setOnRefreshListener(() -> webView.reload());

        setupWebView();

        if (savedInstanceState == null) {
            webView.loadUrl(APP_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Hardware Acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Custom User Agent
        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " CinVerseApp/1.1.0");

        // Native Hardware Bridge for Gesture Controls (Slide Brightness, Volume & WakeLock)
        webView.addJavascriptInterface(new CinVerseNativeBridge(), "CinVerseNative");

        webView.setWebViewClient(new CinVerseWebViewClient());
        webView.setWebChromeClient(new CinVerseChromeClient());

        // Enable APK Download & Update Listener
        webView.setDownloadListener((downloadUrl, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setData(Uri.parse(downloadUrl));
                startActivity(i);
            } catch (Exception e) {
                Toast.makeText(MainActivity.this, "Opening download...", Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Native Bridge exposed to JavaScript for hardware-level controls
     * matching premium media players like VLC and MX Player.
     */
    public class CinVerseNativeBridge {

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }

        @JavascriptInterface
        public int getAppVersionCode() {
            return 2;
        }

        @JavascriptInterface
        public String getAppVersionName() {
            return "1.1.0";
        }

        @JavascriptInterface
        public void downloadAndInstallUpdate(final String apkUrl) {
            runOnUiThread(() -> {
                try {
                    String target = (apkUrl != null && !apkUrl.isEmpty()) 
                        ? apkUrl 
                        : "https://github.com/Gourav-Dadheech/CinVerse/releases/download/v1.1.0/CinVerse-v1.1.0.apk";
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(target));
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Downloading update...", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void setBrightness(final float brightnessRatio) {
            // brightnessRatio: 0.05f to 1.0f
            runOnUiThread(() -> {
                try {
                    WindowManager.LayoutParams layoutParams = getWindow().getAttributes();
                    layoutParams.screenBrightness = Math.max(0.05f, Math.min(1.0f, brightnessRatio));
                    getWindow().setAttributes(layoutParams);
                } catch (Exception e) {
                    // Fallback handled gracefully in webview
                }
            });
        }

        @JavascriptInterface
        public void setVolume(final int volumePercent) {
            // volumePercent: 0 to 100
            runOnUiThread(() -> {
                try {
                    AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                    if (audioManager != null) {
                        int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                        int targetVol = Math.round((Math.max(0, Math.min(100, volumePercent)) / 100.0f) * maxVol);
                        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, targetVol, 0);
                    }
                } catch (Exception e) {
                    // Fallback handled gracefully in webview
                }
            });
        }

        @JavascriptInterface
        public void setKeepScreenOn(final boolean keepOn) {
            runOnUiThread(() -> {
                try {
                    if (keepOn) {
                        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    } else {
                        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    }
                } catch (Exception e) {
                    // Ignored
                }
            });
        }

        @JavascriptInterface
        public void vibrate(final int durationMs) {
            runOnUiThread(() -> {
                try {
                    Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                    if (v != null && v.hasVibrator()) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            v.vibrate(VibrationEffect.createOneShot(Math.min(100, Math.max(10, durationMs)), VibrationEffect.DEFAULT_AMPLITUDE));
                        } else {
                            v.vibrate(durationMs);
                        }
                    }
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void extractStream(final String embedUrl, final String mediaTitle) {
            runOnUiThread(() -> startStreamExtraction(embedUrl, mediaTitle));
        }

        @JavascriptInterface
        public void cancelExtraction() {
            runOnUiThread(() -> stopStreamExtraction());
        }
    }

    private class CinVerseWebViewClient extends WebViewClient {

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            progressBar.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            progressBar.setVisibility(View.GONE);
            swipeRefresh.setRefreshing(false);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String url = uri.toString();

            // Handle magnet, torrent, intent, vlc or market links
            if (url.startsWith("magnet:") || url.startsWith("intent:") ||
                url.startsWith("vlc:") || url.startsWith("market:") || url.startsWith("tel:")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "No external app installed to handle this link.", Toast.LENGTH_SHORT).show();
                }
                return true;
            }

            // Allow APK downloads, GitHub releases, and direct update downloads
            if (url.endsWith(".apk") || (url.contains("github.com") && url.contains("/releases"))) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Cannot download APK: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
                return true;
            }

            // Allow internal domains
            if (url.contains("cinverse.vexr.dev") || url.contains("cineverse-uq71.onrender.com") || url.contains("localhost")) {
                return false;
            }

            // Allow reputable video stream providers inside player
            if (url.contains("vidbolt.xyz") || url.contains("superembed.stream") || url.contains("seapi.link") ||
                url.contains("2embed.cc") || url.contains("smashystream") || url.contains("smashy.stream") ||
                url.contains("vidsrc") || url.contains("youtube.com") || url.contains("streamwish") || url.contains("filemoon") ||
                url.contains("streamtape") || url.contains("dood") || url.contains("mixdrop")) {
                return false;
            }

            // Block external ad popups and spam redirects
            return true;
        }
    }

    private class CinVerseChromeClient extends WebChromeClient {

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            if (newProgress < 100) {
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(newProgress);
            } else {
                progressBar.setVisibility(View.GONE);
            }
        }

        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (customView != null) {
                callback.onCustomViewHidden();
                return;
            }

            customView = view;
            customViewCallback = callback;

            swipeRefresh.setVisibility(View.GONE);
            fullscreenContainer.setVisibility(View.VISIBLE);
            fullscreenContainer.addView(view, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }

        @Override
        public void onHideCustomView() {
            if (customView == null) return;

            fullscreenContainer.removeView(customView);
            fullscreenContainer.setVisibility(View.GONE);
            swipeRefresh.setVisibility(View.VISIBLE);

            if (customViewCallback != null) {
                customViewCallback.onCustomViewHidden();
            }

            customView = null;
            customViewCallback = null;

            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_USER);
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }
    }

    /**
     * Start background headless stream extraction for the given embed URL.
     * Intercepts .m3u8, .mp4, and HLS manifest streams directly from the network layer.
     */
    @SuppressLint("SetJavaScriptEnabled")
    private void startStreamExtraction(final String embedUrl, final String mediaTitle) {
        stopStreamExtraction();

        if (embedUrl == null || embedUrl.trim().isEmpty()) {
            return;
        }

        if (extractorWebView == null) {
            extractorWebView = new WebView(this);
            WebSettings extractorSettings = extractorWebView.getSettings();
            extractorSettings.setJavaScriptEnabled(true);
            extractorSettings.setDomStorageEnabled(true);
            extractorSettings.setDatabaseEnabled(true);
            extractorSettings.setMediaPlaybackRequiresUserGesture(false);
            extractorSettings.setUserAgentString("Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 CinVerseStreamExtractor/1.0");
        }

        final boolean[] streamCaptured = {false};

        extractorWebView.setWebViewClient(new WebViewClient() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    String reqUrl = request.getUrl().toString();
                    if (!streamCaptured[0] && isCandidateStreamUrl(reqUrl)) {
                        streamCaptured[0] = true;
                        onStreamCapturedSuccess(reqUrl, mediaTitle);
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onLoadResource(WebView view, String url) {
                super.onLoadResource(view, url);
                if (!streamCaptured[0] && isCandidateStreamUrl(url)) {
                    streamCaptured[0] = true;
                    onStreamCapturedSuccess(url, mediaTitle);
                }
            }
        });

        // 18-second safety timeout
        extractionTimeoutRunnable = () -> {
            if (!streamCaptured[0]) {
                stopStreamExtraction();
                notifyStreamCaptureFailed(embedUrl, "Extraction timed out. Falling back.");
            }
        };
        mainHandler.postDelayed(extractionTimeoutRunnable, 18000);

        extractorWebView.loadUrl(embedUrl);
    }

    private void stopStreamExtraction() {
        if (extractionTimeoutRunnable != null) {
            mainHandler.removeCallbacks(extractionTimeoutRunnable);
            extractionTimeoutRunnable = null;
        }
        if (extractorWebView != null) {
            try {
                extractorWebView.stopLoading();
                extractorWebView.loadUrl("about:blank");
            } catch (Exception ignored) {}
        }
    }

    private boolean isCandidateStreamUrl(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();

        // Filter out advertising, analytics, tracking, telemetry, static assets
        if (lower.contains("google-analytics") || lower.contains("googlesyndication") ||
            lower.contains("doubleclick") || lower.contains("facebook.com") ||
            lower.contains("cloudflareinsights") || lower.contains("/beacon") ||
            lower.contains("stats") || lower.contains("clarity.ms") || lower.contains(".css") ||
            lower.contains(".png") || lower.contains(".jpg") || lower.contains(".svg") ||
            lower.contains(".woff") || lower.contains(".woff2") || lower.contains(".ico")) {
            return false;
        }

        // Catch HLS playlists or MP4 video streams
        return lower.contains(".m3u8") || lower.contains(".mp4") ||
               lower.contains("/master.m3u8") || lower.contains("/index.m3u8") ||
               lower.contains("/playlist.m3u8") || lower.contains("chunklist") ||
               lower.contains("/manifest/") || (lower.contains("/hls/") && !lower.contains(".js"));
    }

    private void onStreamCapturedSuccess(final String streamUrl, final String mediaTitle) {
        runOnUiThread(() -> {
            stopStreamExtraction();
            try {
                String safeUrl = org.json.JSONObject.quote(streamUrl);
                String safeTitle = org.json.JSONObject.quote(mediaTitle != null ? mediaTitle : "");
                String js = "if (window.CinVerseNativeBridgeListener && typeof window.CinVerseNativeBridgeListener.onStreamExtracted === 'function') { " +
                            "  window.CinVerseNativeBridgeListener.onStreamExtracted(" + safeUrl + ", " + safeTitle + "); " +
                            "}";
                webView.evaluateJavascript(js, null);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void notifyStreamCaptureFailed(final String embedUrl, final String reason) {
        runOnUiThread(() -> {
            try {
                String safeUrl = org.json.JSONObject.quote(embedUrl != null ? embedUrl : "");
                String safeReason = org.json.JSONObject.quote(reason != null ? reason : "");
                String js = "if (window.CinVerseNativeBridgeListener && typeof window.CinVerseNativeBridgeListener.onStreamFailed === 'function') { " +
                            "  window.CinVerseNativeBridgeListener.onStreamFailed(" + safeUrl + ", " + safeReason + "); " +
                            "}";
                webView.evaluateJavascript(js, null);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    @Override
    public void onBackPressed() {
        if (customView != null) {
            CinVerseChromeClient client = (CinVerseChromeClient) webView.getWebChromeClient();
            if (client != null) client.onHideCustomView();
            return;
        }

        if (webView.canGoBack()) {
            webView.goBack();
            return;
        }

        if (backPressedTime + 2000 > System.currentTimeMillis()) {
            super.onBackPressed();
        } else {
            Toast.makeText(this, "Press back again to exit CinVerse", Toast.LENGTH_SHORT).show();
            backPressedTime = System.currentTimeMillis();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        stopStreamExtraction();
        if (extractorWebView != null) {
            extractorWebView.destroy();
            extractorWebView = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
