/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package com.nolgong.pedometer;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import org.apache.cordova.*;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class Pedometer extends CordovaPlugin implements SensorEventListener
{
    private final String TAG = "CordovaPedometer";
    private SensorManager sensorManager;
    private Sensor countSensor;
    private CallbackContext callbackContext;

    private boolean activityRunning;
    private float numberOfSteps;
    private long timestamp;
    private int accuracy = SensorManager.SENSOR_STATUS_UNRELIABLE;

    public Pedometer() {
        this.numberOfSteps = 0;
        this.timestamp = 0;
        this.activityRunning = false;
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        LOG.i(TAG, "execute()");
        this.callbackContext = callbackContext;
        if (action.equals("isStepCountingAvailable")) {
            this.isStepCountingAvailable();
        } else if (action.equals("startPedometerUpdates")){

            if (!this.activityRunning) {
                this.startPedometerUpdates();
            }
        } else if (action.equals("stopPedometerUpdates")){
            if (this.activityRunning) {
                this.stopPedometerUpdates();
            }
        } else {
            return false;
        }
        PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT, "");
        result.setKeepCallback(true);
        callbackContext.sendPluginResult(result);
        return true;
    }

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        LOG.i(TAG, "initialize() " + sensorManager);
        super.initialize(cordova, webView);
        sensorManager = (SensorManager) cordova.getActivity().getSystemService(Context.SENSOR_SERVICE);
        this.numberOfSteps = 0;
    }

    public void isStepCountingAvailable() {
        this.activityRunning = true;
        countSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (countSensor != null) {
            LOG.i(TAG, "isStepCountingAvailable() " + countSensor);
            sensorManager.registerListener(this, countSensor, SensorManager.SENSOR_DELAY_UI);
            PluginResult result = new PluginResult(PluginResult.Status.OK);
            result.setKeepCallback(true);
            callbackContext.sendPluginResult(result);
        }
        else {
            LOG.i(TAG, "isStepCountingAvailable() fail");
            PluginResult err = new PluginResult(PluginResult.Status.ERROR);
            err.setKeepCallback(true);
            callbackContext.sendPluginResult(err);
        }
    }

    public void startPedometerUpdates() {
        LOG.i(TAG, "startPedometerUpdates() " + this.activityRunning);
        if (this.activityRunning) {
            return;
        }
        this.activityRunning = true;
        countSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (countSensor != null) {
            LOG.i(TAG, "StepCountingAvailable " + countSensor);
            sensorManager.registerListener(this, countSensor, SensorManager.SENSOR_DELAY_UI);
            this.activityRunning = true;
        }
        else {
            LOG.i(TAG, "StepCountingAvailable fail");
            this.activityRunning = false;
            JSONObject errorObj = new JSONObject();
            try {
                errorObj.put("message", "Step Counter could not be started.");
            } catch (JSONException e) {
                e.printStackTrace();
            }
            PluginResult err = new PluginResult(PluginResult.Status.ERROR, errorObj);
            err.setKeepCallback(true);
            callbackContext.sendPluginResult(err);
            return;
        }
    }

    public void stopPedometerUpdates() {
        this.activityRunning = false;
        sensorManager.unregisterListener(this);
        this.accuracy = SensorManager.SENSOR_STATUS_UNRELIABLE;
    }

//    @Override
//    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
//        super.initialize(cordova, webView);
//        this.sensorManager = (SensorManager) cordova.getActivity().getSystemService(Context.SENSOR_SERVICE);
//    }

    @Override
    public void onSensorChanged(SensorEvent event) {
//        LOG.i(TAG, "onSensorChanged()");
        if (this.activityRunning) {
            if (this.accuracy >= SensorManager.SENSOR_STATUS_ACCURACY_HIGH) {
                long temptime = System.currentTimeMillis();
                if (temptime - this.timestamp > 2000) {
                    LOG.i(TAG, "onSensorChanged() count : " + event.values[0]);
                    this.numberOfSteps = event.values[0];
                    // this.timestamp = System.currentTimeMillis();
                    this.timestamp = temptime;
                    PluginResult result = new PluginResult(PluginResult.Status.OK, this.getStepCountJSON());
                    result.setKeepCallback(true);
                    callbackContext.sendPluginResult(result);
                }
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (this.activityRunning) {
            LOG.i(TAG, "onAccuracyChanged() " + accuracy);
            this.accuracy = accuracy;
        }
    }

//    private void fail(String message) {
//        JSONObject errorObj = new JSONObject();
//        try {
//            // errorObj.put("code", code);
//            errorObj.put("message", message);
//        } catch (JSONException e) {
//            e.printStackTrace();
//        }
//        PluginResult err = new PluginResult(PluginResult.Status.ERROR, errorObj);
//        err.setKeepCallback(true);
//        callbackContext.sendPluginResult(err);
//    }

    private void stop() {
        if (this.activityRunning) {
            sensorManager.unregisterListener(this);
        }
        this.activityRunning = false;
        this.accuracy = SensorManager.SENSOR_STATUS_UNRELIABLE;
    }

    private JSONObject getStepCountJSON() {
        LOG.i(TAG, "getStepCountJSON() " + this.numberOfSteps + " " + this.timestamp);
        JSONObject r = new JSONObject();
        try {
            r.put("numberOfSteps", this.numberOfSteps);
            r.put("timestamp", this.timestamp);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return r;
    }

    public void onResume() {
        LOG.i(TAG, "onResume()");
        startPedometerUpdates();
    }

    public void onPause() {
        LOG.i(TAG, "onPause()");
        if (this.activityRunning) {
            this.stop();
        }
    }

    public void onDetroy() {
        LOG.i(TAG, "onDetroy()");
        if (this.activityRunning) {
            this.stop();
        }
    }

    @Override
    public void onReset() {
        LOG.i(TAG, "onReset()");
        if (this.activityRunning) {
            this.stop();
        }
    }
//    @Override
//    public void onCreate(Bundle savedInstanceState)
//    {
//        super.onCreate(savedInstanceState);
//        super.init();
//        // Set by <content src="index.html" /> in config.xml
//        loadUrl(launchUrl);
//    }
}
