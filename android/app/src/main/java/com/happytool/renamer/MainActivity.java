package com.happytool.renamer;

import android.net.Uri;
import android.os.Bundle;
import android.provider.DocumentsContract;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ContentRenamePlugin.class);
        super.onCreate(savedInstanceState);
    }
}

@CapacitorPlugin(name = "ContentRename")
class ContentRenamePlugin extends Plugin {

    @PluginMethod
    public void rename(PluginCall call) {
        String uriString = call.getString("uri");
        String newName = call.getString("newName");

        if (uriString == null || newName == null) {
            call.reject("URI or New Name is null");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);
            
            // Remove file extension from newName if DocumentsContract.renameDocument appends it or needs pure name
            // Some providers need the raw name without extension, but most need the full name with extension.
            // We pass the full newName directly.
            Uri resultUri = DocumentsContract.renameDocument(
                getContext().getContentResolver(), 
                uri, 
                newName
            );
            
            if (resultUri != null) {
                JSObject ret = new JSObject();
                ret.put("uri", resultUri.toString());
                call.resolve(ret);
            } else {
                call.reject("Failed to rename document: returned null");
            }
        } catch (Exception e) {
            call.reject("Failed to rename: " + e.getMessage());
        }
    }
}
