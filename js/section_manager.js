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
       $this.json_data=[]
       $this.data= $.csv.toObjects(_data.replaceAll('\t', ''))
       // make sure to only work with the sections
        for (var i=0; i< $this.data.length;i++){
            if($this.data[i].type=="section"){
                $this.json_data.push($this.data[i])
                // to do make this more robust
                //check if there is a disclaimer
                if($this.data[i]?.disclaimer){
                    $this.setup_disclaimer($this.data[i],i)
                }


            }else if ($this.data[i].type=="overlay"){

                 $this.load_data($this.data[i].data,false,$this.add_overlay,i)
            }

        }
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
    setup_disclaimer(_data,_id){
        $('#disclaimer_heading').html(_data.name);
        $('#disclaimer_text').html(_data.disclaimer);

        if(typeof($.cookie("disclaimer_"+_id)) =='undefined'){
            $('#disclaimer').modal('show');
        }else{
            $("#disclaimer_dont_show_again_checkbox" ).prop("checked", true );
        }
         $("#disclaimer_dont_show_again").html(LANG.DISCLAIMER.DONT_SHOW_AGAIN)
        $("#disclaimer_dont_show_again_checkbox").on("click", function(){
           if($("#disclaimer_dont_show_again_checkbox").is(':checked')){
            $.cookie("disclaimer_"+_id,'hide')
           }else{
            $.removeCookie("disclaimer_"+_id, { path: '/' });
           }
            console.log( $.cookie("disclaimer_"+_id))
        })
        $("#info_but").on("click", function(){ $('#disclaimer').modal('show');})
        $("#info_but").show()

    }
    add_overlay(_data,_slot){

        var data =$.csv.toObjects(_data.replaceAll('\t', ''))
        console.log(section_manager.json_data)

            //$this.layer_control.addOverlay(layer, data[i].name);

         for (var i=0; i<data.length;i++){
            //inject the loaded data
            var slot=_slot+i//add i to treat each individually
            section_manager.json_data[slot]={}
            section_manager.json_data[slot].all_data=data[i]
            section_manager.json_data[slot].all_data["title_col"]=data[i].name
            section_manager.json_data[slot].all_data["id"]="section_id_"+slot
            layer_manager.toggle_layer("section_id_"+slot,"mapservice",false,data[i].URL)
            //turn down Transparency

            //$("#section_id_"+slot+"_slider").slider("value",0)
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
            //add parent_id to each item
            var all_data=$this.json_data[slot[0]].all_data
            for (var i=0;i<all_data.length;i++){
               all_data[i].parent_id=slot[0]// create a reference to the for mix and match filtering
              }

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
                    this.join_geojson(section.all_data,data_to_join.data,data_to_join[2],data_to_join[3],section["title_col"])
                    var show_cols=section.show_cols.split(",").map(function(item) {
                          return item.trim();
                        });
                    var filter_cols=section.filter_cols.split(",").map(function(item) {
                          return item.trim();
                        });
                    var separated_cols=section.separated_cols.split(",").map(function(item) {
                          return item.trim();
                        });
                    section.filter_cols=filter_cols
                    this.update_geojson_properties(section.all_data,show_cols,separated_cols,section?.image_col)
                    filter_manager.create_filter_values(section,section.all_data,filter_cols,section?.year_start_col,section?.year_end_col);
                }
                //console.log("second data",section.data[j].data,section.data[j][1])

            }
          }

    }
    join_geojson(all_data,data_to_join,left_join_col,right_join_col,title_col){

        for (var i=0;i<all_data.length;i++){
            // inject an id for access
            all_data[i]._id=i
            //store a sort col for universal access
             all_data[i]._sort_col= all_data[i][title_col]

            var left_join_val=all_data[i][left_join_col].toLowerCase()
            for (var j=0;j<data_to_join.features.length;j++){
                //console.log(data_to_join.features[j].properties[right_join_col],"values")
               if( data_to_join.features[j].properties[right_join_col] && left_join_val == data_to_join.features[j].properties[right_join_col].toLowerCase()){
                    for (var p in data_to_join.features[j].properties){
                        // inject all the properties from the geojson
                        all_data[i][p]=data_to_join.features[j].properties[p]
                    }
                    // add the feature
                    if(!all_data[i]?.feature){
                        //first time to add features

                        all_data[i].feature = {"type": "FeatureCollection","features": []}
                        all_data[i].feature.features.push(data_to_join.features[j])
                        all_data[i].feature.features[0].geometry.type="MultiPolygon"
                        // keep the feature and child id consistent
                        all_data[i].feature.features[0].id=all_data[i]._id;
                        //wrap the coordinates in an array to allow for more coordinates to be joined

                        if(all_data[i].feature.features[0].geometry.coordinates[0][0].length==2){
                             all_data[i].feature.features[0].geometry.coordinates=[all_data[i].feature.features[0].geometry.coordinates]
                        }



                    }else{
//                        console.log(  all_data[i].feature)
//                        if(  all_data[i].feature.features[0].geometry.type=="Polygon"){
//                            //change the type the first time
//                            all_data[i].feature.features[0].geometry.type="MultiPolygon"
//                            //warp in array
//                           all_data[i].feature.features[0].geometry.coordinates=[all_data[i].feature.features[0].geometry.coordinates]
//                        }
                        all_data[i].feature.features[0].geometry.coordinates.push(data_to_join.features[j].geometry.coordinates)
                        console.log("we have more to add",data_to_join.features[j])

                    }


                   // break // don't break as there may be more features to add
               }
            }

        }
    }
    update_geojson_properties(all_data,show_cols,separated_cols,image_col){
        // we really need the details stored in the properties
        for (var i=0;i<all_data.length;i++){
            var properties={}

            for (var j=0;j<show_cols.length;j++){
                 // inject all the properties form the geojson
                 properties[show_cols[j]]=  all_data[i][show_cols[j]]
                 for (var k=0;k<separated_cols.length;k++){
                    if(show_cols[j]==separated_cols[k]){
                        properties[show_cols[j]] = properties[show_cols[j]].split(";").map(function(item) {
                          return item.trim();
                        });
                    }
                 }

            }
            // and if there is an image col
            if(image_col){
                //first split on ;
                var images = properties[image_col]
                var html_images =""
                for(var img in images){
                   html_images+=String(images[img]).image_text()
                }
                properties[image_col]=html_images
               }
            if(all_data[i]?.feature){
                all_data[i].feature.features[0].properties=properties
            }

        }
    }

    setup_interface(){
        this.list_sections()
         after_filters()
        filter_manager.init_search_interface(this.json_data)
        // if there is only one section, select it and move to results
        //if(this.json_data.length==1){
            setTimeout(() => {
               $("#section_id_0").trigger("click");
                $("#arrow_0").trigger("click");
                 $("#nav_wrapper").hide();
            }, "100");

       // }

    }
    list_sections(){
         var html= '<ul class="list-group"' +'">'
         for (var i=0;i<this.json_data.length;i++){
             var id = i
             html += "<li class='list-group-item d-flex justify-content-between list-group-item-action' "
//             html +=  "onmouseleave='filter_manager.hide_bounds()' "
//             html+= "onmouseenter='filter_manager.show_bounds(\""+id+"\")' "
                html+=">"
                html+= this.json_data[i]["name"]
                html+='<div class="float-end input-group-text"><span class="form-check" ><input class="form-check-input section_check" type="checkbox" value="" id="section_id_'+id+'" ></span>'
                html +="<button type='button' class='btn  shadow-none'  style='margin-top: -5px;' onclick='filter_manager.list_results(\""+id+"\")' id='arrow_"+id+"'><i  class='bi bi-chevron-right'></i></button>"
             html+="</div>"

             html+="</li>"
        }
        html+="</ul>"

        $("#sections_view").html(html)
        $(".section_check").change(function() {
            filter_manager.show_section($(this).attr('id'))

        });

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

 


