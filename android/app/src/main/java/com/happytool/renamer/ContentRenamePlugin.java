package com.happytool.renamer;

import android.net.Uri;
import android.provider.DocumentsContract;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ContentRename")
public class ContentRenamePlugin extends Plugin {

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
            
            // Perform SAF document renaming using content resolver
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
