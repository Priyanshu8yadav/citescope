package com.citescope.ai;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.graphics.Bitmap;

public class MainActivity extends Activity {
    WebView webView;
    ProgressBar progressBar;
    static final String APP_URL = "https://citescope-riyanshyadav.vercel.app";

    static class CustomWebViewClient extends WebViewClient {
        private final MainActivity activity;

        CustomWebViewClient(MainActivity activity) {
            this.activity = activity;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            if (activity.progressBar != null) {
                activity.progressBar.setVisibility(View.VISIBLE);
            }
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            if (activity.progressBar != null) {
                activity.progressBar.setVisibility(View.GONE);
            }
        }
    }

    static class CustomWebChromeClient extends WebChromeClient {
        private final MainActivity activity;

        CustomWebChromeClient(MainActivity activity) {
            this.activity = activity;
        }

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            if (activity.progressBar != null) {
                activity.progressBar.setProgress(newProgress);
                if (newProgress == 100) {
                    activity.progressBar.setVisibility(View.GONE);
                }
            }
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = (WebView) findViewById(R.id.webview);
        progressBar = (ProgressBar) findViewById(R.id.progressBar);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(true);

        webView.setWebViewClient(new CustomWebViewClient(this));
        webView.setWebChromeClient(new CustomWebChromeClient(this));

        webView.loadUrl(APP_URL);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
