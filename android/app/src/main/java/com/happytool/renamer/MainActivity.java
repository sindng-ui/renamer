package com.happytool.renamer;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ContentRenamePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
