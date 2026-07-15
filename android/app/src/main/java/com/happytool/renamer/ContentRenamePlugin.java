package com.happytool.renamer;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "ContentRename")
public class ContentRenamePlugin extends Plugin {

    @PluginMethod
    public void rename(PluginCall call) {
        String uriString = call.getString("uri");
        String newName = call.getString("newName");

        if (uriString == null || newName == null) {
            call.reject("URI or newName is null");
            return;
        }

        try {
            Uri uri = Uri.parse(uriString);
            ContentResolver resolver = getContext().getContentResolver();

            // === Strategy 1: Resolve to real file path and use File.renameTo ===
            String realPath = resolveRealPath(uri, resolver);
            if (realPath != null) {
                File originalFile = new File(realPath);
                if (originalFile.exists()) {
                    File parentDir = originalFile.getParentFile();
                    File renamedFile = new File(parentDir, newName);
                    
                    if (originalFile.renameTo(renamedFile)) {
                        // Notify MediaStore about the change so gallery apps pick it up
                        notifyMediaStoreChange(originalFile, renamedFile);
                        
                        JSObject ret = new JSObject();
                        ret.put("uri", Uri.fromFile(renamedFile).toString());
                        ret.put("path", renamedFile.getAbsolutePath());
                        call.resolve(ret);
                        return;
                    }
                }
            }

            // === Strategy 2: DocumentsContract SAF rename (document provider URIs) ===
            try {
                Uri resultUri = DocumentsContract.renameDocument(resolver, uri, newName);
                if (resultUri != null) {
                    JSObject ret = new JSObject();
                    ret.put("uri", resultUri.toString());
                    call.resolve(ret);
                    return;
                }
            } catch (Exception ignored) {
                // Fall through to Strategy 3
            }

            // === Strategy 3: MediaStore DISPLAY_NAME update (media content URIs) ===
            try {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, newName);
                int rowsUpdated = resolver.update(uri, values, null, null);
                if (rowsUpdated > 0) {
                    JSObject ret = new JSObject();
                    ret.put("uri", uri.toString());
                    call.resolve(ret);
                    return;
                }
            } catch (Exception ignored) {
                // Fall through to final reject
            }

            call.reject("All rename strategies failed for this URI type");

        } catch (Exception e) {
            call.reject("Failed to rename: " + e.getMessage());
        }
    }

    /**
     * Attempts to resolve a content:// URI to a real filesystem path.
     * Handles MediaStore URIs, DocumentProvider URIs, and file:// URIs.
     */
    private String resolveRealPath(Uri uri, ContentResolver resolver) {
        String scheme = uri.getScheme();

        // Direct file:// URI
        if ("file".equalsIgnoreCase(scheme)) {
            return uri.getPath();
        }

        // content:// URI
        if ("content".equalsIgnoreCase(scheme)) {
            // Handle DownloadsProvider, MediaProvider, ExternalStorageProvider
            String authority = uri.getAuthority();

            // ExternalStorageProvider (e.g. content://com.android.externalstorage.documents/...)
            if ("com.android.externalstorage.documents".equals(authority)) {
                String docId = DocumentsContract.getDocumentId(uri);
                String[] split = docId.split(":");
                String type = split[0];
                if ("primary".equalsIgnoreCase(type)) {
                    return Environment.getExternalStorageDirectory() + "/" + split[1];
                }
            }

            // DownloadsProvider
            if ("com.android.providers.downloads.documents".equals(authority)) {
                String docId = DocumentsContract.getDocumentId(uri);
                if (docId != null && docId.startsWith("raw:")) {
                    return docId.substring(4);
                }
            }

            // MediaProvider (content://media/external/images/media/123)
            if ("media".equals(authority) || (authority != null && authority.contains("media"))) {
                Cursor cursor = null;
                try {
                    String[] projection = { MediaStore.MediaColumns.DATA };
                    cursor = resolver.query(uri, projection, null, null, null);
                    if (cursor != null && cursor.moveToFirst()) {
                        int columnIndex = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA);
                        String path = cursor.getString(columnIndex);
                        if (path != null) return path;
                    }
                } catch (Exception ignored) {
                } finally {
                    if (cursor != null) cursor.close();
                }
            }

            // General fallback: try DATA column on any content URI
            Cursor cursor = null;
            try {
                String[] projection = { MediaStore.MediaColumns.DATA };
                cursor = resolver.query(uri, projection, null, null, null);
                if (cursor != null && cursor.moveToFirst()) {
                    int columnIndex = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA);
                    String path = cursor.getString(columnIndex);
                    if (path != null) return path;
                }
            } catch (Exception ignored) {
            } finally {
                if (cursor != null) cursor.close();
            }
        }

        return null;
    }

    /**
     * After a physical file rename, notify the MediaStore so gallery apps
     * and file managers see the updated filename without requiring a reboot.
     */
    private void notifyMediaStoreChange(File oldFile, File newFile) {
        try {
            // Remove old entry
            getContext().getContentResolver().delete(
                MediaStore.Files.getContentUri("external"),
                MediaStore.MediaColumns.DATA + "=?",
                new String[]{ oldFile.getAbsolutePath() }
            );

            // Trigger media scan for new file
            android.media.MediaScannerConnection.scanFile(
                getContext(),
                new String[]{ newFile.getAbsolutePath() },
                null,
                null
            );
        } catch (Exception ignored) {
            // Non-critical: rename succeeded even if MediaStore notification fails
        }
    }
}
