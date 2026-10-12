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

            // Allow internal domains
            if (url.contains("cinverse.vexr.dev") || url.contains("cineverse-uq71.onrender.com") || url.contains("localhost")) {
                return false;
            }

            // Allow reputable video stream providers inside player
            if (url.contains("vidbolt.xyz") || url.contains("vidfast.vc") ||
                url.contains("2embed.cc") || url.contains("smashystream.com") ||
                url.contains("vidsrc") || url.contains("youtube.com")) {
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
}
