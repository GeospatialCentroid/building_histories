/**
 * @description The section manager loads a csv file which defines the sections.
 Each section can have a csv file and an ESRI feature service
 The csv files are loaded to allows a full site search for data
 and the visualization file is only loaded when the section is selected
 *
 * @file   This files defines the Section_Manager class.
 * @author Kevin Worthington
 *
 * @param {Object} properties     The properties passed as a json object specifying:
    csv     The path to the csv file the site structure '

 */


class Section_Manager {
        constructor(properties) {
        //store all the properties passed
        for (var p in properties){
            this[p]=properties[p]
        }

    }
    init() {
     this.load_data(this.config,"csv",this.parse_data)

     var $this=this
     //simulate progress - load up to 90%
      var current_progress = 0;
      this.progress_interval = setInterval(function() {
          current_progress += 5;
          $("#loader").css("width", current_progress + "%")
          if (current_progress >= 90)
              clearInterval($this.progress_interval);

      }, 100);
    }
    load_data(url,type,call_back,slot){
        // type csv = should be 'text' and then converted
        // geojson = should be 'json' and then converted
        if(type=='csv'){
            type='text'
        }
         if(type=='geojson'){
            type='json'
        }
        //todo be sure to convert appropriately once loaded
        $.ajax({
            url: url,
            dataType: type,
            slot: slot, //pass through param
            success: function(_data) {
                call_back(_data,this.slot)
            }
         });

    }

    parse_data(_data){
        var $this = section_manager
        // convert the csv file to json and create a subset of the records as needed
       // strip any extraneous tabs
       $this.json_data= $.csv.toObjects(_data.replaceAll('\t', ''))
        for (var i=0; i< $this.json_data.length;i++){
             // split files by semi-colon
            $this.json_data[i].data= $this.json_data[i].data.split(";")
            for (var j=0;j< $this.json_data[i].data.length;j++){
                // split file parts (file, type, left_join_col,right_join_col) by commas
                $this.json_data[i].data[j]=$this.json_data[i].data[j].split(",")

                $this.load_data($this.json_data[i].data[j][0],$this.json_data[i].data[j][1],$this.check_section_completion,[i,j])
            }
        }

    }
    check_section_completion(data,slot){
        // when all the data for a section is loaded, join it together
         var $this = section_manager
         //store the data in the slot
          var section = $this.json_data[slot[0]]
          section.data[slot[1]].data=data
          //check if all the data is available in the specific section
          var all_data_loaded =true
          for (var j=0;j<section.data.length;j++){
            if(!section.data[j]?.data){
                all_data_loaded =false
            }
          }
          if(all_data_loaded){
            console.log("we have all the data")
            $this.join_data($this.json_data[slot[0]])
            //todo create nav with section_name
            //todo pass variables from app.csv

//          section.filter_manager =  new Filter_Manager({
//
//            group_col:section.group_col,
//            image_col:section.image_col,
//            path_col:section.path_col,
//            show_cols:section.show_cols,
//            comma_separated_cols:section.comma_separated_cols,
//            title_col:section.title_col,
//            year_end_col:section.year_end_col,
//            year_start_col:section.year_start_col,
//            json_data:section.all_data
//            })

             //clean up
              delete section.json_data;
              section.items_showing=[]
              console.log(section)
          }

          $this.check_all_section_completion()
    }
    check_all_section_completion(){
        var $this = section_manager
        var all_sections_data_loaded=true
        for (var i=0; i<$this.json_data.length;i++){
             if(!$this.json_data[i]?.all_data){
                all_sections_data_loaded =false
             }
        }
        if (all_sections_data_loaded){

            //hide loader
            clearInterval($this.progress_interval)
            $("#loader").css("width", 100 + "%")
            setTimeout( function() {

                $(".overlay").fadeOut("slow", function () {
                    $(this).css({display:"none",'background-color':"none"});
                });
            },300);

            $this.setup_interface()
        }
    }

    join_data(section){
        // lets start by storing the first loaded data file in the top spot
        section.all_data= $.csv.toObjects(section.data[0].data)//todo if the first loaded data is geojson, we'll want to convert it to a flat json structure for searching
        //takes one or more data files and joins them on a key
        //starting with the second dataset, look for the left_join_col,right_join_col
        //When matched, map all the parameters to the first dataset
        if(section.data.length>0){
            for (var j=1;j<section.data.length;j++){
                var data_to_join=section.data[j]
                var type=data_to_join[1]
                if(type=="geojson"){
                    this.join_geojson(section.all_data,data_to_join.data,data_to_join[2],data_to_join[3])
                    var show_cols=section.show_cols.split(",").map(function(item) {
                          return item.trim();
                        });
                    this.update_geojson_properties(section.all_data,show_cols,section?.image_col)
                }
                //console.log("second data",section.data[j].data,section.data[j][1])

            }
          }

    }
    join_geojson(all_data,data_to_join,left_join_col,right_join_col){

        for (var i=0;i<all_data.length;i++){
            // inject and if for access
            all_data[i]._id=i
            var left_join_val=all_data[i][left_join_col].toLowerCase()
            for (var j=0;j<data_to_join.features.length;j++){
                //console.log(data_to_join.features[j].properties[right_join_col],"values")
               if( data_to_join.features[j].properties[right_join_col] && left_join_val == data_to_join.features[j].properties[right_join_col].toLowerCase()){
                    for (var p in data_to_join.features[j].properties){
                        // inject all the properties from the geojson
                        all_data[i][p]=data_to_join.features[j].properties[p]
                    }
                    // add the feature for ease of access
                    if(!all_data[i]?.feature){
                        //first time to add features
                         //all_data[i].feature = data_to_join.features[j] // does not enable consistent/reliable display of features
                         all_data[i].feature = {"type": "FeatureCollection","features": []}
                          all_data[i].feature.features.push(data_to_join.features[j])

                    }else{
                        console.log(  all_data[i].feature)
                        if(  all_data[i].feature.features[0].geometry.type=="Polygon"){
                            //change the type the first time
                            all_data[i].feature.features[0].geometry.type="MultiPolygon"
                            //warp in array
                           all_data[i].feature.features[0].geometry.coordinates=[all_data[i].feature.features[0].geometry.coordinates]
                        }
                        all_data[i].feature.features[0].geometry.coordinates.push(data_to_join.features[j].geometry.coordinates)


                    }

                    // keep the feature and child id consistent
                    all_data[i].feature.features[0].id=all_data[i]._id;
                   // break // don't break as there may be more featurers to add
               }
            }

        }
    }
    update_geojson_properties(all_data,show_cols,image_col){
        // we really need the details stored in the properties
        var count=0
        for (var i=0;i<all_data.length;i++){
            var properties={}

            for (var j=0;j<show_cols.length;j++){
                // inject all the properties form the geojson
               properties[show_cols[j]]=  all_data[i][show_cols[j]]
            }
            // and if there is an image col
            if(image_col){
                //first split on ;
                var images = properties[image_col].split(";").map(function(item) {
                  return item.trim();
                });
                var html_images =""
                for(var img in images){
                   html_images+=String(images[img]).image_text()
                }
                properties[image_col]=html_images
               }
            if(all_data[i]?.feature){
                count++
                console.log(all_data[i].feature)
                all_data[i].feature.features[0].properties=properties
            }

        }
        console.log("WE have ",count,"shapes")
    }
    setup_interface(){
        this.list_sections()
        run_resize()
        filter_manager.init_search_interface(this.json_data)
        // if there is only one section, select it and move to results
        if(this.json_data.length==1){
            setTimeout(() => {
               $("#section_id_0").trigger("click");
                $("#arrow_0").trigger("click");
            }, "100");

        }
    }
    list_sections(){
         var html= '<ul class="list-group"' +'">'
         for (var i=0;i<this.json_data.length;i++){
             var id = i
             html += "<li class='list-group-item d-flex justify-content-between list-group-item-action' "
//             html +=  "onmouseleave='filter_manager.hide_bounds()' "
//             html+= "onmouseenter='filter_manager.show_bounds(\""+id+"\")' "
                html+=">"
                html+= this.json_data[i]["section_name"]
                html+='<div class="float-end input-group-text"><span class="form-check" ><input class="form-check-input section_check" type="checkbox" value="" id="section_id_'+id+'" ></span>'
                html +="<button type='button' class='btn  shadow-none'  style='margin-top: -5px;' onclick='section_manager.list_results(\""+id+"\")' id='arrow_"+id+"'><i  class='bi bi-chevron-right'></i></button>"
             html+="</div>"

             html+="</li>"
        }
        html+="</ul>"

        $("#sections_view").html(html)
        $(".section_check").change(function() {
            section_manager.show_section($(this).attr('id'))
        });

    }
    show_section(section_id){
        var $this=section_manager
        var parent_id=section_id.replaceAll('section_id_', '')
        console.log(section_id)
        var data = $this.get_match(section_id)

        var item_ids=[]

         var items_showing=section_manager.json_data[parent_id].items_showing
         if($('#'+"section_id_"+parent_id).is(':checked')){
            for (var i=0;i<data.length;i++){
                if(data[i]?.feature){
                    if($.inArray( data[i]._id, items_showing)==-1){
                    item_ids.push(data[i]._id);
                    }else{
                        console.log("ALREADY IN ARRAY ",data[i]._id)
                    }
                }
            }
         }else{
            // we are hiding, take all showing features
            item_ids= [...items_showing]
         }
        layer_manager.toggle_layer("section_id_"+parent_id,"csv_geojson",JSON.parse(JSON.stringify($this.json_data[parent_id].drawing_info.replaceAll('\n', ''))),false,false,item_ids)// todo update this "csv_geojson",false
    }
    list_results(parent_id){
        var $this = section_manager
        $this.showing_id=parent_id
        $this.slide_position("results")
        //move to the results panel and list all the items
        // each items visibility is stored in the filter manager - if showing

        var items_showing=$this.json_data[parent_id].items_showing
        var data = $this.get_match('section_id_'+parent_id)
        var sort_dir=$('#list_sort').val()
        var title_col=$this.json_data[parent_id]["title_col"]
        var sorted_data= [...data]

       if(sort_dir!=''){
           sorted_data= sorted_data.sort((a,b) => (a[title_col] > b[title_col] ) ? 1 : ((b[title_col]  > a[title_col] ) ? -1 : 0))
        }
        if (sort_dir=='desc'){
              sorted_data.reverse()
        }

         var html= '<ul class="list-group"' +'">'

         for (var i=0;i<sorted_data.length;i++){
             var showing=""

             if($.inArray( sorted_data[i]._id, items_showing)>-1){
                //check if the item is showing
                showing="checked"
             }
             html += "<li class='list-group-item d-flex justify-content-between list-group-item-action'>"
             if(sorted_data[i]?.feature){

                 html+='<span style="cursor: pointer;" onclick="section_manager.zoom_item('+parent_id+','+sorted_data[i]._id+')">'+sorted_data[i][title_col]+'</span>'
                 html+='<span><div class="form-check"  onclick="section_manager.show_item('+parent_id+','+sorted_data[i]._id+')"><input class="form-check-input" type="checkbox" '+showing+' value="" id="section_'+parent_id+'_'+sorted_data[i]._id+'" ></div>'
             }else{
                  html+=sorted_data[i][title_col]
             }
             html+="</span>"

             html+="</li>"
        }
        html+="</ul>"

        $("#results_view").html(html)
        //
        $('#result_wrapper').animate({
                scrollTop: 0
            }, 1000);

        run_resize()
    }
    show_item(_id,item_id){
        var $this = section_manager
        //toggle the layer but only show the specific item id
        // note: we'll want to pass an array of ids to
        layer_manager.toggle_layer("section_id_"+_id,"csv_geojson",JSON.parse(JSON.stringify($this.json_data[_id].drawing_info.replaceAll('\n', ''))),false,false,[item_id])
    }
    zoom_item(_id,item_id){
        var $this = section_manager
          var data = $this.get_match('section_id_'+_id)
            for (var i=0;i<data.length;i++){
                if(item_id==data[i]._id){
                    if(data[i]?.feature){
                      map_manager.map_zoom_event(L.geoJSON(data[i].feature).getBounds())
                    }

                    break
                }

            }
    }
    get_match(_id){
        _id=_id.replaceAll('section_id_', '')
        return this.json_data[_id].all_data
    }
    slide_position(panel_name){
        var pos=0
        var width=$("#side_bar").width()
         var nav_text=""
         this.panel_name=panel_name
         switch(panel_name) {
              case 'results':
                pos=width*2
                nav_text=LANG.NAV.BACK_BROWSE +" <i class='bi bi-chevron-left'></i>"
                break;
              case 'details':
                    pos=width*3
                    nav_text=LANG.NAV.BACK_RESULTS+" <i class='bi bi-chevron-left'></i>"
                    break;
              case 'layers':
                    pos=width*4
                    nav_text=LANG.NAV.BACK_RESULTS+" <i class='bi bi-chevron-left'></i>"
                    break;
              case 'sub_details':
                    pos=width*5
                    nav_text=LANG.NAV.BACK_LAYERS+" <i class='bi bi-chevron-left'></i>"
                    break;
              default:
                //show the browse
                nav_text="<i class='bi bi-chevron-right'></i> "+LANG.NAV.BACK_RESULTS
                pos=0

            }
             $("#panels").animate({ scrollLeft: pos });
             $("#nav").html(nav_text)

             $("#search_tab").trigger("click")
    }
    go_back(){

        // based on the panel position choose the movement
        var go_to_panel=""
        if(this.panel_name == 'results'){
            go_to_panel = "browse"
        }else if(this.panel_name == 'browse'){
            go_to_panel = "results"
        }else if(this.panel_name == 'details'){
            go_to_panel = "results"
        }else if(this.panel_name == 'layers'){
            go_to_panel = "results"
        }else if(this.panel_name == 'sub_details'){
            go_to_panel = "layers"
        }else{
            go_to_panel = "results"
        }
        this.slide_position(go_to_panel)
    }

}

 


