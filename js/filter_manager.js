class Filter_Manager {
  constructor(properties) {
    //store all the properties passed
    for (var p in properties){
        this[p]=properties[p]
    }

    // store the subset of results for use
    this.subset_data;
    // store the item in the list
    this.page_num;
    // a dictionary of all the filters set
    this.filters={}
    this.mode='data';
    this.showing_id;// keep track of the current section on display
   }
     init_search_interface(json_data){
        //  called from section manager
        var $this=this
        this.populate_search(json_data)
        $('#list_sort').change(function() {
           $this.show_sorted_results($this.showing_id)
        });



        $("#search").focus();
        $("#search_clear").click(function(){
            $("#search").val("")
            //back to browse
            $this.add_filter(false,null)
            $this.filter()
            //$this.section_manager.slide_position("browse")
        })
        ///--------
        $('input[type=radio][name=search_type]').change(function() {
            $this.mode=this.value
        });
        //When searching - all titles are added to the auto
         $("#search_but").click(function(){
            if($this.mode=="data"){
                console.log("search the data")
               $this.add_filter(false,[$("#search").val()])
               $this.filter();
               //go to results
               $this.section_manager.slide_position("results")
            }else{
                console.log($this.place_url)
                $.get($this.place_url, { q: $("#search").val() }, function(data) {
                    try{
                        $this.show_place_bounds(data[0].boundingbox)
                        $("#search").val(data[0].display_name)
                    }catch(e){

                    }

              })
            }
        })

    }
     show_place_bounds(b){
        var sw = L.latLng(Number(b[0]), Number(b[2])),
            ne = L.latLng(Number(b[1]), Number(b[3])),
            bounds = L.latLngBounds(sw, ne);
            map_manager.map_zoom_event(bounds)

            map_manager.show_copy_link(b[2],b[0],b[3],b[1])

  }
    update_results_info(num){

        $(".total_results").text(LANG.RESULT.FOUND+" "+num+" "+LANG.RESULT.RESULTS)
        $(".spinner-border").hide();


    }
    populate_search(data){
       // to make it easy to select a dataset, an autocomplete control is used and populated based on entered values
       var $this = this
       this.subset=[]
        // loop over the data and add 'value' and 'key' items for use in the autocomplete input element
       for (var i=0;i<data.length;i++){
            // inject and if for access
            var title_col=data[i]['title_col'];
             var section_name=data[i]['section_name'];
            for (var j=0;j<data[i].all_data.length;j++){
                var item=data[i].all_data[j]
                this.subset.push({
                label: item[title_col], //+" ("+section_name+")",
                value: i+"_"+j
                 })

            }
        }
      $( "#search" ).autocomplete({
          source: this.subset,
          minLength: 0,
          select: function( event, ui ) {
                event.preventDefault();

                $("#search").val(ui.item.label)//.substring(0,ui.item.label.indexOf("(")-1));
                $("#search_but").trigger("click")
            },
        focus: function(event, ui) {
            event.preventDefault();
            $("#search").val(ui.item.label);
        }

      });
      $(document).on("keydown", "#search", function(e) {
            if(e.keyCode==13){
                $("#search_but").trigger("click")
            }
        })

//      this.show_results()
//
//      //update counts
//      this.update_results_info(this.subset_data.length)
    }

      add_filter(_id,value){
        console_log("add_filter with a chip",_id,value)
        if (_id ==false){
            _id = LANG.SEARCH.CHIP_SUBMIT_BUT_LABEL
            // add text to the search field
            $("#search").val(value)
        }
        // remove the __ to get the true id
        var id = _id.replaceAll("__", " ");
        // set the filters value
        this.filters[id]=value
        console_log("And the filters are...",this.filters)
        //create text for filter chip
        var text_val=""
        //for number range use dash - separator
        if (value!=null){
            if($.isNumeric(value[0]) && value.length<=2){
                text_val=value[0]+" - "+value[1]
            }else{
                text_val=value.join(", ")
            }
        }
//        this.show_filter_selection(_id.replaceAll( " ", "__"),id+": "+text_val)
        if (value==null){
           this.remove_filter(_id)
        }

    }
     remove_filter(_id){
        var id = _id.replaceAll("__", " ");
        delete this.filters[id]
        //remove filter selection
        //this.remove_filter_selection(_id)
    }
    filter(section_id){
        // create a subset of the items based on the set filters
        var subset=[]
        //loop though the items in the list
        var start=0
        var end=this.section_manager.json_data.length
        if(section_id){
            //allow filtering results from a single section
            start=section_id
            end =section_id+1
        }
        for (var i=start;i<end;i++){
            for (var j=0;j<this.section_manager.json_data[i].all_data.length;j++){
                // compare each to the filter set to create a subset
                var meets_criteria=true; // a boolean to determine if the item should be included

                var obj=this.section_manager.json_data[i].all_data[j]
                for (var a in this.filters){
                    if (a==LANG.SEARCH.CHIP_SUBMIT_BUT_LABEL){
                        // if search term not found in both title and sub title
    //                    if(obj[this.title_col].indexOf(this.filters[a][0]) == - 1 &&  obj[this.sub_title_col].indexOf(this.filters[a][0])==-1){
    //                        meets_criteria=false
    //                    }
                        // convert to string for search
                        var obj_str = JSON.stringify(obj).toLowerCase();
                        if(obj_str.indexOf(this.filters[a][0].toLowerCase() )==-1){
                            meets_criteria=false
                        }

                    }else if (a=='bounds'){
                         if(obj?.[this['bounds_col']]){
                             var b = obj[this['bounds_col']].split(',')
                              var poly1 = turf.polygon([[
                                [b[1],b[0]],
                                [b[1],b[2]],
                                [b[3],b[2]],
                                [b[3],b[0]],
                                [b[1],b[0]]
                                ]])
                              var b = layer_manager.map.getBounds()
                              var poly2 = turf.polygon([[
                              [b._southWest.lat,b._southWest.lng],
                              [b._southWest.lat,b._northEast.lng],
                              [b._northEast.lat,b._northEast.lng],
                              [b._northEast.lat,b._southWest.lng],
                               [b._southWest.lat,b._southWest.lng]
                              ]])

                              if (!turf.booleanIntersects(poly1, poly2)){
                                meets_criteria=false
                              }
                        }else{
                             // no coordinates
                             meets_criteria=false
                        }

                    }else if (a!='p'){
                        if ($.isNumeric(this.filters[a][0])){
                            //we are dealing with a numbers - check range
                            if (obj[a]<this.filters[a][0] || obj[a]>this.filters[a][1]){
                                 meets_criteria=false
                            }
                        }else{
                            // match the elements
                            // make and exception for searching through array values
                             if ($.isArray(obj[a])){
                                // loop over the filters array checking if its in the object attribute array
                                for(var j=0;j<this.filters[a].length;j++){
                                     if ($.inArray(this.filters[a][j],obj[a])==-1){
                                        meets_criteria=false
                                     }
                                }
                             }else{
                                if ($.inArray(obj[a],this.filters[a])==-1){
                                    meets_criteria=false
                                }
                             }
                        }
                    }
                }
                if (meets_criteria==true){
                        subset.push(obj)
                }
            }
        }
        //this.populate_search(subset)
       // this.generate_filters(subset)
        // be sure to set the filter_manager params for setting filters during menu regeneration

        this.params=[this.filters]
        console_log( "params were set",this.filters)
//        this.set_filters();
//        this.save_filter_params()
//
//        this.add_filter_watcher();

        //this.slide_position("results");
        // keep track of the subset for sorting
         this.subset_data=subset
         this.show_sorted_results(subset)
    }
    add_filter_watcher(){
        var $this=this;
        // watch at the filter list level
        $('.filter_list').change( function() {
           var id = $(this).attr('id')
            // create a new list of selected values
           var vals=[]
           $(this).find(":checked").each(function() {
                vals.push($(this).val())

           })
           if(vals.length==0){
                vals=null
           }
           console_log("add_filter_watcher",$(this).attr('id'),vals)
           $this.add_filter($(this).attr('id'),vals);
           $this.filter()
        });
    }
    //---
     create_filter_values(section,all_data,filter_cols,year_start_col,year_end_col){
        // set variables to assist with grouping and filtering
        // a group allows a way to show a whole bunch of features at the same time.
        //todo add col grouping


        // year_start_col and year_end_cols allow a way to show change over time
        var years=[]
        for (var i=0;i<all_data.length;i++){
            if(year_start_col){
               years.push(Number(all_data[i][year_start_col]))
            }
            if(year_end_col && all_data[i][year_end_col]){
                 years.push(Number(all_data[i][year_end_col]))
            }
        }
        years.sort()
        section.start=years[0]
        section.end=years[years.length-1]
    }
    //--
     generate_filters(_data,filter_cols){
        // create a list of all the unique values
        // then create controls to allow users to filter items
        // these controls will update their counts when filters are selected
        $("#filters").empty()
        var $this=this;
        // create a catalog of all the unique options for each of attributes
        this.catalog={}
        // create a separate obj to track the occurrences of each unique option
        this.catalog_counts={}
        for (var i=0;i<_data.length;i++){
            var obj=_data[i]
//            //add a unique id, prepend 'item_' for use as a variable, only do this on first pass
//            if(!this.ids_added){
//              obj["id"]="item_"+i;
//            }

            //for (var a in obj){// use instead if we want to filter on all
            for (var j in filter_cols){
                a=filter_cols[j]
               //start with a check for numeric
               if ($.isNumeric(obj[a])){
                obj[a]=parseInt(obj[a])
               }
               // see if we hve and array
               if ($.isArray(obj[a])){
                    // need to add all the array items into the catalog
                    for (var j = 0; j<obj[a].length;j++){
                        this.add_to_catalog(a,obj[a][j])
                    }
               }else{
                    this.add_to_catalog(a,obj[a])
               }

            }

        }
        // sort all the items
        // create controls - Note column names are used for ids - spaces replaced with '__'
         for (var a in this.catalog){
                // join with counts and sort by prevalence
               var catalog_and_counts=[]
               for(var j=0;j<this.catalog[a].length;j++){
                    catalog_and_counts.push([this.catalog_counts[a][j],this.catalog[a][j]])
               }

                catalog_and_counts.sort(function (a, b) {
                    if (a[0] === b[0]) {
                        return 0;
                    }
                    else {
                        return (a[0] > b[0]) ? -1 : 1;
                    }
                });
               // now extract the values
               this.catalog[a]=[]
               this.catalog_counts[a]=[]
               for(var j=0;j<catalog_and_counts.length;j++){
                    this.catalog[a].push(catalog_and_counts[j][1])
                    this.catalog_counts[a].push(catalog_and_counts[j][0])
               }
               // generate control html based on data type (use last value to workaround blank first values)
               if (this.catalog[a].length>0 && $.inArray(a,$this.omit_filter_item)==-1){
                if( $.isNumeric(this.catalog[a][this.catalog[a].length-1])){
                    //create a range slider for numbers - https://jqueryui.com/slider/#range
                     var min = Math.min.apply(Math, this.catalog[a]);
                     var max = Math.max.apply(Math, this.catalog[a]);
                     $("#filters").append(this.get_range_slider(a,min,max))
                     //to allow  fine-tuning - add min and max values
                     var ext="_slider"
                     $("#"+a.replaceAll(" ", "__")+ext).slider({
                      range: true,
                      min: min,
                      max: max,
                      values: [ min, max ],
                      change: function( event, ui ) {
                        var id = $(this).attr('id')
                        var _id= id.substring(0,id.length-ext.length)
                        //set handle values
                        $("#"+id+"_handle0").text(ui.values[ 0 ])
                        $("#"+id+"_handle1").text(ui.values[ 1 ])
                        //add the filter
                        $this.add_filter(_id,ui.values)
                        $this.filter()
                      },
                      slide: function( event, ui ) {
                        var id = $(this).attr('id')
                        var _id= id.substring(0,id.length-ext.length)
                        //set handle values
                        $("#"+id+"_handle0").text(ui.values[ 0 ])
                        $("#"+id+"_handle1").text(ui.values[ 1 ])
                      }

                    });
                    // add reference to input element to bind update
                }else{
                    $("#filters").append(this.get_multi_select(a,this.catalog[a],this.catalog_counts[a]))
                }
           }
         }
    }
    add_to_catalog(col,val){
        if(typeof(this.catalog[col])=="undefined"){
               this.catalog[col]=[val]
               this.catalog_counts[col]=[1]
            }else{
                //populate with any new value
                var array_index=$.inArray(val,this.catalog[col])
                if (array_index==-1){
                    this.catalog[col].push(val)
                    this.catalog_counts[col].push(1)
                }else{
                    this.catalog_counts[col][array_index]+=1
                }
            }
    }
     get_multi_select(id,options,counts){
        var html=""
        var _id = id.replaceAll(" ", "__");
        html+="<label class='form-label' for='"+_id+"'>"+id+"</label>"
        html+="<div class='form-group filter_list' name='"+_id+"' id='"+_id+"' >"
        for (var o in options){
            var val = options[o];
            var text=options[o];
            if(text==""){
                text=LANG.SEARCH.BLANK
            }
            var count = ""
            if (counts){
               count = counts[o]
            }
            html+='<label class="list-group-item d-flex justify-content-between list-group-item-action">'
            html+='<span><input class="form-check-input me-1 align-left" type="checkbox" value="'+val+'">'+text+'</span>'
            html+='<span class="badge bg-primary rounded-pill">'+count+'</span></label>'
        }

        html+=" </div>"
        return html

    }
     get_range_slider(id,min,max){
        var _id = id.replaceAll(" ", "__");
        var html=""
        html+="<label class='form-label' for='"+_id+"'>"+id+"</label>"
        html+="<div id='"+_id+"_slider' class='slider-range'><div id='"+_id+"_slider_handle0' class='ui-slider-handle'>"+min+"</div><div id='"+_id+"_slider_handle1' class='ui-slider-handle'>"+max+"</div>"
          html+='<button class="btn btn-outline-secondary slider_toggle " onclick="filter_manager.slider_toggle(this)" type="button" ><i class="bi bi-play-fill"></i></button>'
          html+="</div>"
        return html
    }
    //------- animate slider

    slider_toggle(_this) {
        console.log(_this)
        var $this=this
        var icon=$(_this).children("i")
        if(icon.hasClass("bi-pause-fill")){
            $this.slider_pause(icon)
            return
        }
        icon.removeClass("bi-play-fill")
        icon.addClass("bi-pause-fill")

        var slider=$(_this).parent(".slider-range")

        //if we are at the end. start at the beginning
        if(slider.slider("option", "max")==slider.slider("values")[1]){
            slider.slider('values',1,slider.slider("option", "min"))
        }
        $this.slider_step(slider,icon)
    }
   slider_step(_slider,_icon) {
        var $this=this
        var curr_position=_slider.slider("values")[1]
        var next_position=curr_position+5
        if(next_position>_slider.slider("option", "max")){
            next_position=_slider.slider("option", "max")
        }
       _slider.slider('values',1,next_position).trigger('change');
        //if we are at the end. start at the beginning
        if(_slider.slider("option", "max")==curr_position){
              $this.slider_pause(_icon)
              return
        }

        $this.slider_timeout=setTimeout(function(){
        $this.slider_step(_slider,_icon)
        },300)
    }
    slider_pause(_icon) {
        console.log("slider_pause",_icon)
        //stop the timer
       _icon.removeClass("bi-pause-fill")
       _icon.addClass("bi-play-fill")
        clearTimeout(this.slider_timeout);
    }

    //-----------
    show_section(section_id){
        var $this=this
        var parent_id=section_id.replaceAll('section_id_', '')
        console.log(section_id)
        var data = $this.section_manager.get_match(section_id)

        var item_ids=[]

         var items_showing=$this.section_manager.json_data[parent_id].items_showing
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
         $this.show_items(parent_id,item_ids)
         console.log("FIT THE BOUNDS ..........")
         if(!$this.has_earth_param){
         layer_manager.map.fitBounds(layer_manager.layers[layer_manager.layers.length-1].layer_obj.getBounds());
         }
         $this.has_earth_param=false
    }
    list_results(parent_id){
        var $this = this
        //set initial variables
        $this.showing_id=parent_id;
        $this.filters={};// reset filters


        $this.section_manager.slide_position("results");
        //move to the results panel and list all the items
        // each items visibility is stored in the filter manager - if showing

        var items_showing=$this.section_manager.json_data[parent_id].items_showing
        var data = $this.section_manager.get_match('section_id_'+parent_id)
        $this.generate_filters(data,$this.section_manager.json_data[parent_id].filter_cols)
        $this.add_filter_watcher();
        var title_col=$this.section_manager.json_data[parent_id]["title_col"]
        $this.sort_data(data,title_col)
    }
    show_sorted_results(parent_id){
       //take the subset and short by title

        if(!this.subset_data){
            this.subset_data=this.section_manager.json_data[parent_id].all_data
        }
        this.sort_data(this.subset_data)
    }
    sort_data(data,sort_col){
        if(!sort_col){
            // use the default if none is provided
            sort_col="_sort_col"
        }

        var sort_dir=$('#list_sort').val()

        var sorted_data= [...data]

       if(sort_dir!=''){
           sorted_data= sorted_data.sort((a,b) => (a[sort_col] > b[sort_col] ) ? 1 : ((b[sort_col]  > a[sort_col] ) ? -1 : 0))
        }
        if (sort_dir=='desc'){
              sorted_data.reverse()
        }

        this.show_results(sorted_data)
    }

    show_items(_id,item_ids){
        //toggle the layer but only show the specific item id
        // note: we'll want to pass an array of ids to
        layer_manager.toggle_layer("section_id_"+_id,"csv_geojson",JSON.parse(this.section_manager.json_data[_id].drawing_info.replaceAll('\n', '')),false,100,item_ids)
    }
    zoom_item(_id,item_id){
          var data = this.section_manager.get_match('section_id_'+_id)
            for (var i=0;i<data.length;i++){
                if(item_id==data[i]._id){
                    if(data[i]?.feature){
                      map_manager.map_zoom_event(L.geoJSON(data[i].feature).getBounds())
                    }

                    break
                }

            }
    }
    click_item(_id,item_id){
          var data = this.section_manager.get_match('section_id_'+_id)
            for (var i=0;i<data.length;i++){
                if(item_id==data[i]._id){
                    if(data[i]?.feature){
//                         setTimeout(function(){
//
//                         }, 1500);
                            map_manager.map_click_event(L.geoJSON(data[i].feature).getBounds().getCenter())
                            map_manager.show_popup_details(data[i].feature.features)
                    }

                    break
                }

            }
    }



    //--
     show_results(sorted_data){
        // hide all the items
        var $this = this;
        try{
             var parent_id=sorted_data[0].parent_id
             // todo hide the ids better
             $this.show_items(parent_id,[...$this.section_manager.json_data[parent_id].items_showing])
        }catch(e){}

          var item_ids =[]
         // the sorted data could be a mix of items from multiple sections

         var html= '<ul class="list-group"' +'">'
        var title_col="_sort_col"
         for (var i=0;i<sorted_data.length;i++){
             item_ids.push(sorted_data[i]._id)
            var items_showing = this.section_manager.json_data[sorted_data[i].parent_id].items_showing

            var parent_id = sorted_data[i].parent_id
             var showing=""
//             if($.inArray( sorted_data[i]._id, items_showing)>-1){
//                //check if the item is showing
//
//             }
             showing="checked";//we're showing them all for now
             html += "<li class='list-group-item d-flex justify-content-between list-group-item-action'>"
             if(sorted_data[i]?.feature){
                 html+='<span style="cursor: pointer;" onclick="filter_manager.zoom_item('+parent_id+','+sorted_data[i]._id+');filter_manager.click_item('+parent_id+','+sorted_data[i]._id+');javascript:map_manager.scroll_to_map()">'+sorted_data[i][title_col]+'</span>'
                 html+='<span><div class="form-check"  onclick="filter_manager.show_items('+parent_id+',['+sorted_data[i]._id+'])"><input class="form-check-input" type="checkbox" '+showing+' value="" id="section_'+parent_id+'_'+sorted_data[i]._id+'" ></div>'
             }else{
                  html+=sorted_data[i][title_col]
             }
             html+="</span>"

             html+="</li>"
        }
        html+="</ul>"

        $("#results_view").html(html)
        // todo show the ids better
        if(item_ids.length>0){
            $this.show_items(parent_id,item_ids)
        }

        //
        $('#result_wrapper').animate({
                scrollTop: 0
            }, 1000);
         $this.update_results_info(sorted_data.length)

    }
}