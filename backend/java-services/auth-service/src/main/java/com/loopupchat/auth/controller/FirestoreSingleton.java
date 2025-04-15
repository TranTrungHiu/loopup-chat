
package com.loopupchat.auth.controller;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;

public class FirestoreSingleton {
    private static Firestore firestore;

    private FirestoreSingleton() {
    }

    public static Firestore getFirestore() {
        if (firestore == null) {
            firestore = FirestoreClient.getFirestore();
        }
        return firestore;
    }
}