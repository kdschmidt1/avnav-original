package de.wellenvogel.avnav.gemf;

import android.app.Activity;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.support.v4.provider.DocumentFile;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.HashMap;
import java.util.Iterator;

import de.wellenvogel.avnav.main.Constants;
import de.wellenvogel.avnav.util.AvnLog;
import de.wellenvogel.avnav.util.AvnUtil;


public class GemfReader {
    private static final String GEMFEXTENSION =".gemf";
    private Activity activity;
    //mapping of url name to char descriptors
    private HashMap<String, GemfChart> gemfFiles =new HashMap<String, GemfChart>();

    public GemfReader(Activity a){
        activity=a;
    }
    public void updateChartList(){
        HashMap<String, GemfChart> newGemfFiles=new HashMap<String, GemfChart>();
        SharedPreferences prefs=AvnUtil.getSharedPreferences(activity);
        File workDir=AvnUtil.getWorkDir(prefs,activity);
        File chartDir = new File(workDir, "charts");
        readChartDir(chartDir.getAbsolutePath(),"1",newGemfFiles);
        String secondChartDirStr=prefs.getString(Constants.CHARTDIR,"");
        if (! secondChartDirStr.isEmpty()){
            if (! secondChartDirStr.equals(workDir.getAbsolutePath())){
                readChartDir(secondChartDirStr,"2",newGemfFiles);
            }
        }
        //now we have all current charts - compare to the existing list and create/delete entries
        //currently we assume only one thread to change the chartlist...
        for (String url : newGemfFiles.keySet()){
            GemfChart chart=newGemfFiles.get(url);
            long lastModified=chart.getLastModified();
            if (gemfFiles.get(url) == null ){
                gemfFiles.put(url,chart);
            }
            else{
                if (gemfFiles.get(url).getLastModified() < lastModified){
                    gemfFiles.get(url).close();
                    gemfFiles.put(url,chart);
                }
            }
        }
        Iterator<String> it=gemfFiles.keySet().iterator();
        while (it.hasNext()){
            String url=it.next();
            if (newGemfFiles.get(url) == null){
                it.remove();
            }
            else{
                GemfChart chart=gemfFiles.get(url);
                if (chart.closeInactive()){
                    AvnLog.i("closing gemf file "+url);
                }
            }
        }
    }

    public GemfChart getChartDescription(String url){
        return gemfFiles.get(url);
    }

    private void readChartDir(String chartDirStr,String index,HashMap<String,GemfChart> arr) {
        if (chartDirStr == null) return;
        if (Build.VERSION.SDK_INT >= 21) {
            if (chartDirStr.startsWith("content:")) {
                //see https://github.com/googlesamples/android-DirectorySelection/blob/master/Application/src/main/java/com/example/android/directoryselection/DirectorySelectionFragment.java
                //and https://stackoverflow.com/questions/36862675/android-sd-card-write-permission-using-saf-storage-access-framework
                Uri dirUri = Uri.parse(chartDirStr);
                DocumentFile dirFile=DocumentFile.fromTreeUri(activity,dirUri);
                for (DocumentFile f : dirFile.listFiles()){
                    if (f.getName().endsWith(".gemf")){
                        String urlName = Constants.REALCHARTS + "/" + index + "/gemf/" + f.getName();
                        arr.put(urlName, new GemfChart(activity, f, urlName, f.lastModified()));
                        AvnLog.d(Constants.LOGPRFX,"readCharts: adding gemf url "+urlName+" for "+f.getUri());
                    }
                    if (f.getName().endsWith(".xml")){
                        String name=f.getName().substring(0,f.getName().length()-".xml".length());
                        String urlName=Constants.REALCHARTS+"/"+index+"/avnav/"+name;
                        GemfChart newChart=new GemfChart(activity, f,urlName,f.lastModified());
                        newChart.setIsXml();
                        arr.put(urlName,newChart);
                        AvnLog.d(Constants.LOGPRFX,"readCharts: adding xml url "+urlName+" for "+f.getUri());
                    }
                }
                return;
            }
        }
        File chartDir=new File(chartDirStr);
        if (! chartDir.isDirectory()) return;
        File[] files=chartDir.listFiles();
        if (files == null) return;
        for (File f : files) {
            try {
                if (f.getName().endsWith(GEMFEXTENSION)){
                    String gemfName = f.getName();
                    gemfName = gemfName.substring(0, gemfName.length() - GEMFEXTENSION.length());
                    String urlName= Constants.REALCHARTS + "/"+index+"/gemf/" + gemfName;
                    arr.put(urlName,new GemfChart(activity, f,urlName,f.lastModified()));
                    AvnLog.d(Constants.LOGPRFX,"readCharts: adding gemf url "+urlName+" for "+f.getAbsolutePath());
                }
                if (f.getName().endsWith(".xml")){
                    String name=f.getName().substring(0,f.getName().length()-".xml".length());
                    String urlName=Constants.REALCHARTS+"/"+index+"/avnav/"+name;
                    GemfChart newChart=new GemfChart(activity, f,urlName,f.lastModified());
                    newChart.setIsXml();
                    arr.put(urlName,newChart);
                    AvnLog.d(Constants.LOGPRFX,"readCharts: adding xml url "+urlName+" for "+f.getAbsolutePath());
                }
            } catch (Exception e) {
                Log.e(Constants.LOGPRFX, "exception handling file " + f.getAbsolutePath());
            }
        }
    }

    public void readAllCharts(JSONArray arr) {
        //here we will have more dirs in the future...
        try {
            for (String url : gemfFiles.keySet()) {
                GemfChart chart = gemfFiles.get(url);
                JSONObject e = new JSONObject();
                e.put("name", url.replaceAll(".*/", ""));
                e.put("time", chart.getLastModified() / 1000);
                e.put("url", "/"+ Constants.CHARTPREFIX + "/"+url);
                arr.put(e);
            }
        } catch (Exception e) {
            Log.e(Constants.LOGPRFX, "exception readind chartlist:", e);
        }

    }

}
