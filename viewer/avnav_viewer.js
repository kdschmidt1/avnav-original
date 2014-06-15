/*
# vim: ts=2 sw=2 et
###############################################################################
# Copyright (c) 2014, Andreas Vogel andreas@wellenvogel.net
# parts of software from movable-type
# http://www.movable-type.co.uk/
# for their license see the file latlon.js
#
#  Permission is hereby granted, free of charge, to any person obtaining a
#  copy of this software and associated documentation files (the "Software"),
#  to deal in the Software without restriction, including without limitation
#  the rights to use, copy, modify, merge, publish, distribute, sublicense,
#  and/or sell copies of the Software, and to permit persons to whom the
#  Software is furnished to do so, subject to the following conditions:
#
#  The above copyright notice and this permission notice shall be included
#  in all copies or substantial portions of the Software.
#
#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
#  OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
#  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
#  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
#  DEALINGS IN THE SOFTWARE.
###############################################################################

icons partly from http://www.tutorial9.net/downloads/108-mono-icons-huge-set-of-minimal-icons/
                  http://ionicons.com/ (MIT license)
*/

goog.provide('avnav.main');
goog.require('avnav.gui.Handler');
goog.require('avnav.map.MapHolder');
goog.require('avnav.util.PropertyHandler');
goog.require('avnav.util.Property');
goog.require('avnav.nav.NavObject');
/**
 * currently we must require all pages somewhere
 */
goog.require('avnav.gui.Mainpage');
goog.require('avnav.gui.Statuspage');
goog.require('avnav.gui.Navpage');
goog.require('avnav.gui.Aispage');
goog.require('avnav.gui.Settingspage');



var propertyDefinitions=function(){
    return {
        layers:{
            ais: new avnav.util.Property(true,"AIS",avnav.util.PropertyType.CHECKBOX),
            track: new avnav.util.Property(true,"Track",avnav.util.PropertyType.CHECKBOX),
            nav: new avnav.util.Property(true,"Navigation",avnav.util.PropertyType.CHECKBOX),
            boat: new avnav.util.Property(true,"Boat",avnav.util.PropertyType.CHECKBOX)
        },
        NM: new avnav.util.Property(1852), //one mile
        buttonUpdateTime: new avnav.util.Property( 500), //timer for button updates
        slideTime: new avnav.util.Property( 300), //time in ms for upzoom
        slideLevels: new avnav.util.Property( 3), //start with that many lower zoom levels
        maxUpscale: new avnav.util.Property(2), //2 levels upscale (otherwise we need too much mem)
        hideLower: new avnav.util.Property( true), //if set, hide smaller zoom layers when completely covered
        maxZoom: new avnav.util.Property( 21),  //only allow upscaling up to this zom level
        minGridLedvel: new avnav.util.Property( 10),
        loggingEnabled: new avnav.util.Property( true),
        positionQueryTimeout: new avnav.util.Property( 1000,"Position",avnav.util.PropertyType.RANGE,[500,5000,10]), //1000ms
        trackQueryTimeout: new avnav.util.Property( 5000,"Track",avnav.util.PropertyType.RANGE,[500,10000,10]), //5s in ms
        bearingColor: new avnav.util.Property( "#DDA01F"),
        bearingWidth: new avnav.util.Property( 3),
        trackColor: new avnav.util.Property( "#D71038"),
        trackWidth: new avnav.util.Property( 3),
        trackInterval: new avnav.util.Property( 30), //seconds
        initialTrackLength: new avnav.util.Property( 24*120), //multiplies with trackInterval - so this gives 24h
        aisQueryTimeout: new avnav.util.Property( 5000,"AIS",avnav.util.PropertyType.RANGE,[1000,10000,10]), //ms
        aisDistance: new avnav.util.Property( 20,"AIS-Range(nm)",avnav.util.PropertyType.RANGE,[1,100]), //distance for AIS query in nm
        maxAisErrors: new avnav.util.Property( 3), //after that many errors AIS display will be switched off
        minAISspeed: new avnav.util.Property( 0.2), //minimal speed in kn that we consider when computing cpa/tcpa
        maxAisTPA: new avnav.util.Property( 3),    //max. computed AIS TPA time in h (otherwise we do not consider this)
        aisWarningCpa: new avnav.util.Property( 500,"AIS Warning(m)",avnav.util.PropertyType.RANGE,[100,5000,10]), //m for AIS warning (500m)
        aisWarningTpa: new avnav.util.Property( 900,"AIS-Warning-TPA(s)",avnav.util.PropertyType.RANGE,[30,3600,10]), //in s - max time for tpa warning (15min)
        aisNormalImage: new avnav.util.Property( 'images/ais-default.png'),
        aisNearestImage: new avnav.util.Property( 'images/ais-nearest.png'),
        aisWarningImage: new avnav.util.Property( 'images/ais-warning.png'),
        statusQueryTimeout: new avnav.util.Property( 3000), //ms
        centerDisplayTimeout: new avnav.util.Property( 45000), //ms - auto hide measure display (0 - no auto hide)
        navUrl: new avnav.util.Property( "avnav_navi.php"),
        maxGpsErrors: new avnav.util.Property( 3), //after that much invalid responses/timeouts the GPS is dead
        cookieName: new avnav.util.Property( "avnav"),
        statusErrorImage: new avnav.util.Property( "images/RedBubble40.png"),
        statusOkImage: new avnav.util.Property( "images/GreenBubble40.png"),
        statusIcons: {
            INACTIVE: new avnav.util.Property( "images/GreyBubble40.png"),
            STARTED: new avnav.util.Property(  "images/YellowBubble40.png"),
            RUNNING: new avnav.util.Property(  "images/YellowBubble40.png"),
            NMEA: new avnav.util.Property(	  "images/GreenBubble40.png"),
            ERROR: new avnav.util.Property(	  "images/RedBubble40.png")
        },
        currentView:{},
        marker:{}
    }
};



$.cookie.json = true;

function log(txt){
    try{
        //console.log(txt);
    }catch(e){}
}



/**
 * main function called when dom is loaded
 *
 */
avnav.main=function() {
    var propertyHandler=new avnav.util.PropertyHandler(propertyDefinitions(),{});
    propertyHandler.loadUserData();
    var navobject=new avnav.nav.NavObject(propertyHandler);
    var mapholder=new avnav.map.MapHolder(propertyHandler,navobject);
    var gui=new avnav.gui.Handler(propertyHandler,navobject,mapholder);
    gui.showPage("mainpage");
    log("avnav loaded");
};
goog.exportSymbol('avnav.main',avnav.main);
