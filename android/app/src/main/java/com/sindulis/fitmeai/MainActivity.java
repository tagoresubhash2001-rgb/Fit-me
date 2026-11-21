package com.sindulis.fitmeai;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.sindulis.fitmeai.steps.StepsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(StepsPlugin.class); // FitMe on-device steps (app plugin, not an npm package)
        super.onCreate(savedInstanceState);
    }
}
