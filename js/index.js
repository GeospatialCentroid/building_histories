//create a filter manager to control the selection of items from a CSV file
var section_manager;
var table_manager;
var usp={};// the url params object to be populated
var LANG;
var map_manager;
var layer_manager;
var filter_manager;
var analytics_manager;
if (typeof(params)=="undefined"){
    var params = {}
}
var last_params={}
var usp={};// the url params object to be populated

var browser_control=false; //flag for auto selecting to prevent repeat cals

$( function() {

    $.getJSON('i18n/en.json', function(data){
            LANG=data
            initialize_interface()
    });


});

function initialize_interface(){

    var sort_str=""
    if(!$.isEmptyObject(usp) && usp.get("sort")){
        sort_str=usp.get("sort")
    }

    $("[for='filter_bounds_checkbox']").text(LANG.SEARCH.LIMIT)
    $("#filter_date_to").text(LANG.SEARCH.TO)
    $("[for='filter_date_checkbox']").text(LANG.SEARCH.LIMIT_DATE)

    $("#radio_data_label").text(LANG.SEARCH.RADIO_DATA_LABEL)

    $("#radio_place_label").text(LANG.SEARCH.RADIO_PLACE_LABEL)
    //

    setup_params()
    table_manager = new Table_Manager({
    elm_wrap:"data_table_wrapper",
          elm:"data_table"})
    table_manager.init()
     setup_map();
     //create a flag to determine if we should zoom map based on last view
    var has_earth_param=false

    if (usp?.get && usp.get('e')!=null){
         has_earth_param=true
    }

    //setup_filters()
    analytics_manager = new Analytics_Manager();

    section_manager=new Section_Manager({config:"app.csv",map_manager:map_manager})
    filter_manager = new Filter_Manager({
    section_manager:section_manager,
    place_url:'https://nominatim.openstreetmap.org/search?format=json',
    title_col:"title_col",//universal location for a title
    has_earth_param:has_earth_param
    });
    section_manager.init();
}



function setup_params(){
    if (window.location.search.substring(1)!="" && $.isEmptyObject(params)){
        usp = new URLSearchParams(window.location.search.substring(1).replaceAll("~", "'").replaceAll("+", " "))

        if (usp.get('f')!=null){
            params['f'] = rison.decode("!("+usp.get("f")+")")
        }
        if (usp.get('e')!=null){
            params['e'] =  rison.decode(usp.get('e'))
        }

        if (usp.get('l')!=null && usp.get('l')!="!()"){
            params['l'] =  rison.decode(usp.get('l'))
        }

        // debug mode
        if (usp.get('d')!=null){
           DEBUGMODE=true
        }



    }

}
function setup_map(){
    map_manager = new Map_Manager(
     {params:params['e'] ,
        lat:36.25408922222581,
        lng: -98.7485718727112,
        z:3,
        limit:100 // max results for identify
        })

     map_manager.init()
     map_manager.init_image_map()

      layer_manager = new Layer_Manager({
        map:map_manager.map,
        layers_list:params['l'],
        service_method:services//loaded in html

      })

      layer_manager.add_basemap_control()

}

function after_filters(){

    run_resize()
    add_back_but_support();

    //    disclaimer_manager.init();

    //    download_manager.init();

    init_tabs();
    if ( layer_manager.layers_list){
         for (var i =0;i<layer_manager.layers_list.length;i++){
            console.log(layer_manager.layers_list[i])
            layer_manager.toggle_layer(layer_manager.layers_list[i].id,i)
        }
    }


}


function init_tabs(){
    $("#search_tab").text(LANG.TAB_TITLES.BROWSE_TAB)
    $("#map_tab .label").text(LANG.TAB_TITLES.MAP_TAB)
    $("#download_tab").text(LANG.TAB_TITLES.DOWNLOAD_TAB)
    $(".tab_but").click(function() {
        $(".tab_but").removeClass("active")
        $(this).addClass("active")
        // hide all tab_panels
         $(".tab_panel").hide()
         // show only this one by assuming it's name from the button
         var tab_panel_name = $(this).attr("id").substring(0,$(this).attr("id").indexOf("_"))+"_panel_wrapper"

         $("#"+tab_panel_name).show()
         save_params()

    });
    section_manager.slide_position()
    // click the tab and slide to the panel as appropriate
    if( !$.isEmptyObject(usp) && usp.get("t")){

       move_to_tab(usp.get("t"))
    }
}

function move_to_tab(tab_str){
    return
    var tab_parts = tab_str.split("/")

    // move to the set search panel
    if(tab_parts.length>1){
        filter_manager.slide_position(tab_parts[1])
    }
    if(tab_parts.length>2){
       filter_manager.display_resource_id = tab_parts[2]
    }

   //auto click the tab for state saving
   $("#"+tab_parts[0]).trigger("click")
}
function add_back_but_support(){
    // enable back button support
    window.addEventListener('popstate', function(event) {
        var _params={}
        usp = new URLSearchParams(window.location.search.substring(1).replaceAll("~", "'").replaceAll("+", " "))

            if (usp.get('f')!=null){
                _params['f'] = rison.decode("!("+usp.get("f")+")")
            }
            if (usp.get('e')!=null){
                _params['e'] =  rison.decode(usp.get('e'))
            }

            if (usp.get('l')!=null && usp.get('l')!="!()"){
                _params['l'] =  rison.decode(usp.get('l'))
            }
            browser_control=true
             console.log("BACK buttton handeler")
    //        filter_manager.remove_filters()
    //        filter_manager.filters=[]
    //        $("#filter_bounds_checkbox").prop("checked", false)
    //        filter_manager.set_filters(_params['f'])
    //        filter_manager.filter()

            move_to_tab( usp.get("t"))


            map_manager.move_map_pos( _params['e'])
            browser_control=false

    }, false);
}
function run_resize(){
    $( window ).resize( window_resize);
    setTimeout(function(){
             $( window ).trigger("resize");

             // leave on the dynamic links - turn off the hrefs
             $("#browse_panel .card-body a").attr('href', "javascript: void(0)");

             // rely on scroll advance for results
             $("#next_link").hide();


            // update paging
//            filter_manager.update_parent_toggle_buttons(".content_right")
//            filter_manager.update_parent_toggle_buttons("#details_panel")
//            filter_manager.update_toggle_button()
            if(! DEBUGMODE){
                $("#document .page_nav").hide()
            }else{
                //append d=1, so that debug mode remains
                $("#document .page_nav a").each(function() {
                   $(this).attr("href",  $(this).attr("href") + '&d=1');
                });
            }
            $("#content").show();
           map_manager.map.invalidateSize()
    },100)
        //update the height of the results area when a change occurs
//        $('#side_header').bind('resize', function(){
//
//    });

}
function window_resize() {
        var data_table_height=0
         if( $("#data_table_wrapper").is(":visible")){
           data_table_height= $("#data_table_wrapper").height()
        }
        var header_height=$("#header").outerHeight()+20;
        var footer_height=15//$("#footer").height()
        var window_height= $(window).outerHeight()
        var window_width= $(window).width()
        var minus_height=header_height+footer_height
        console.log("CONTENT HEIGHT",window_height,minus_height,header_height,footer_height)
       $("#content").height(window_height-minus_height)

       $("#map_wrapper").height(window_height-minus_height-data_table_height)
       var scroll_height=window_height-minus_height-$("#side_header").outerHeight()
       //-$("#tabs").outerHeight()-$("#nav_wrapper").outerHeight()
       $("#panels").height(scroll_height)
       $(".panel").height(scroll_height)

//        $("#map_panel_wrapper").height(window_height-$("#tabs").height()-minus_height)
//        $("#map_panel_scroll").height(window_height-$("#tabs").height()-minus_height)

            //
//       $("#tab_panels").css({'top' : ($("#tabs").height()+header_height) + 'px'});

//       .col-xs-: Phones (<768px)
//        .col-sm-: Tablets (≥768px)
//        .col-md-: Desktops (≥992px)
//        .col-lg-: Desktops (≥1200px)


       if (window_width >768){

            // hide the scroll bars
            $('html, body').css({
                overflow: 'hidden',
                height: '100%'
            });
            $("#map_wrapper").width(window_width-$("#side_bar").width()-1)
            $("#data_table_wrapper").width(window_width-$("#side_bar").width()-1)

            map_manager.map.scrollWheelZoom.enable();
       }else{
             //mobile view

             // scroll as needed
             $('html, body').css({
                overflow: 'auto',
                height: 'auto'
            });

            // drop the map down for mobile
            $("#map_wrapper").width(window_width)
            $("#data_table_wrapper").width(window_width)

            map_manager.map.scrollWheelZoom.disable();
       }
        //final sets
        $("#panels").width($("#side_bar").width())
        $(".panel").width($("#side_bar").width())
        if(map_manager){
            map_manager.map.invalidateSize()
        }
        // slide to position
         $("#panels").stop(true, true)
         // if we are on the search tab, make sure the viewable panel stays when adjusted
        if("search_tab"==$("#tabs").find(".active").attr("id")){
            section_manager.slide_position(section_manager.panel_name)
        }

        $("#result_wrapper").css({"max-height":scroll_height-$("#filter_area").height()})

 }
 function save_params(){

    // access the managers and store the info URL sharing
     var p ="?"
//     p += "?="+encodeURIComponent(rison.encode(filter_manager.filters))
       p +="&e="+rison.encode(map_manager.params)


//    if(layer_manager && typeof(layer_manager.layers_list)!="undefined"){
//        p+="&l="+rison.encode(layer_manager.layers_list)
//    }

//    p+='&t='+$("#tabs").find(".active").attr("id")
//    if(typeof(filter_manager.panel_name)!="undefined"){
//        // add the panel if available
//        p+="/"+filter_manager.panel_name;
//    }
//    if(typeof(filter_manager.display_resource_id)!="undefined"){
//        // add the display_resource_id if available
//        p+="/"+filter_manager.display_resource_id;
//    }

//    if (filter_manager.page_rows){
//        p +="&rows="+(filter_manager.page_start+filter_manager.page_rows)
//    }
//    if (filter_manager.page_start){
//        p +="&start=0"
//    }
//    if (filter_manager.sort_str){
//        p +="&sort="+filter_manager.sort_str
//    }
//    if (filter_manager.fq_str){
//        p +="&fq="+filter_manager.fq_str
//    }
    // retain debug mode
    if (DEBUGMODE){
        p +="&d=1"
    }

    // before saving the sate, let's make sure they are not the same
    if(JSON.stringify(p) != JSON.stringify(last_params) && !browser_control){
       window.history.pushState(p, null, window.location.pathname+p.replaceAll(" ", "+").replaceAll("'", "~"))
        last_params = p
    }

}

