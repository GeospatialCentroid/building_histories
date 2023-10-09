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
   }
     init_search_interface(json_data){
        //  called from section manager
        var $this=this
        this.populate_search(json_data)
        $('#list_sort').change(function() {
           $this.list_results($this.section_manager.showing_id)
        });



        $("#search").focus();
        $("#search_clear").click(function(){
            $("#search").val("")
            //back to browse
            $this.section_manager.slide_position("browse")
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
                $.get($this.place_url, { q: $("#search").val() }, function(data) {
                    try{
                        $this.show_place_bounds(data[0].boundingbox)
                        $("#search").val(data[0].display_name)
                    }catch(e){

                    }

              })
            }
        })


//    $('#filter_bounds_checkbox').change(
//        function(){
//             filter_manager.update_bounds_search($(this))
//        }
//    );
//    //
//    //date search
//    $('#filter_date_checkbox').change(
//        function(){
//          filter_manager.delay_date_change();
//        }
//    );
//    var start =new Date("1800-01-01T00:00:00")
//    var end =new Date();
//    $("#filter_start_date").datepicker({ dateFormat: 'yy-mm-dd'}).val($.format.date(start, 'yyyy-MM-dd'))
//    $("#filter_end_date").datepicker({ dateFormat: 'yy-mm-dd'}).val($.format.date(end, 'yyyy-MM-dd'))
//
//    $("#filter_start_date").change( function() {
//        filter_manager.delay_date_change()
//
//    });
//    $("#filter_end_date").change( function() {
//      filter_manager.delay_date_change()
//    });
//
//    var values = [start.getTime(),end.getTime()]
//    $("#filter_date .filter_slider_box").slider({
//        range: true,
//        min: values[0],
//        max: values[1],
//        values:values,
//        slide: function( event, ui ) {
//
//           $("#filter_start_date").datepicker().val($.format.date(new Date(ui.values[0]), 'yyyy-MM-dd'))
//           $("#filter_end_date").datepicker().val($.format.date(new Date(ui.values[1]), 'yyyy-MM-dd'))
//           filter_manager.delay_date_change()
//
//     }
//    })
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
                label: item[title_col] +" ("+section_name+")",
                value: i+"_"+j
                 })

            }
        }
      $( "#search" ).autocomplete({
          source: this.subset,
          minLength: 0,
          select: function( event, ui ) {
                event.preventDefault();
                $("#search").val(ui.item.label.substring(0,ui.item.label.indexOf("(")-1));
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
    filter(){
        // create a subset of the items based on the set filters
        var subset=[]
        //loop though the items in the list
        for (var i=0;i<this.section_manager.json_data.length;i++){
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
         this.show_results(subset)
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
     create_filter_values(section,all_data,group_cols,year_start_col,year_end_col){
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
    //------- Data slider
     setup_slider(section_id){
        var $this=this
        // show if there is date information
        var parent_id=section_id.replaceAll('section_id_', '')
        var section=$this.section_manager.json_data[parent_id]

         $("#slider").slider({
            min: section.start,
            max: section.end,
            range: true,
            step: 1,
            values: [section.start, section.end],
            change: function(event, ui) {
                 $this.delay_date_change(section_id)
                 $("#filter_start_date").val( $("#slider").slider("values")[ 0 ])
                 $("#filter_end_date").val($("#slider").slider("values")[ 1 ])
            }
        });
    }

    slider_toggle() {
        var $this=this
        if($("#slider_toggle i").hasClass("bi-pause-fill")){
            $this.slider_pause()
            return
        }
         $("#slider_toggle i").removeClass("bi-play-fill")
         $("#slider_toggle i").addClass("bi-pause-fill")


        //if we are at the end. start at the beginning
        if($("#slider").slider("option", "max")==$("#slider").slider("values")[1]){
             $("#slider").slider('values',1,$("#slider").slider("option", "min"))
        }
        $this.slider_step()
    }
   slider_step() {
        var $this=this
        var curr_position=$("#slider").slider("values")[1]
        var next_position=curr_position+5
        if(next_position>$("#slider").slider("option", "max")){
            next_position=$("#slider").slider("option", "max")
        }
        $("#slider").slider('values',1,next_position).trigger('change');
        //if we are at the end. start at the beginning
        if($("#slider").slider("option", "max")==curr_position){
              $this.slider_pause()
              return
        }

        $this.slider_timeout=setTimeout(function(){
        $this.slider_step()
        },300)
    }
    slider_pause() {
        //stop the timer
        $("#slider_toggle i").removeClass("bi-pause-fill")
        $("#slider_toggle i").addClass("bi-play-fill")
        clearTimeout(this.slider_timeout);
    }
    //
     delay_date_change(section_id){
        var $this=this
        // prevent multiple calls when editing filter parameters
        if(this.timeout){
            clearTimeout(this.timeout);
        }
        this.timeout=setTimeout(function(){
              $this.update_date_filter(section_id)
              $this.timeout=false

        },300)
     }
     update_date_filter(section_id){
         var $this=this
         var start = $("#slider").slider("values")[ 0 ]
         var end = $("#slider").slider("values")[ 1 ]
         var item_ids =  $this.get_results_between(section_id,start,end);

         var parent_id=section_id.replaceAll('section_id_', '')
         // note: the section manager still tracks the items_showing
         var items_showing=$this.section_manager.json_data[parent_id].items_showing;
         $this.show_items(parent_id,[...$this.section_manager.json_data[parent_id].items_showing])
         $this.show_items(parent_id,item_ids)
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
         layer_manager.map.fitBounds(layer_manager.layers[layer_manager.layers.length-1].layer_obj.getBounds());
    }

    get_results_between(section_id,start,end){
        var $this=this;
        var parent_id=section_id.replaceAll('section_id_', '')
        var section=$this.section_manager.json_data[parent_id]
        var data=$this.section_manager.json_data[parent_id].all_data

        // get a list of all the features that have a start value greater than or equal to the start
                 // and an end value less than or equal to the end value
                 // if no end value set it to latest value
        var item_ids=[]
        for (var i=0;i<data.length;i++){
            var meets_criteria =true
            var val = Number(data[i][section.year_start_col])
            if (val<start || val>end){
                 meets_criteria=false
            }
           if (meets_criteria && data[i]?.feature){
            item_ids.push(data[i]._id)
           }
        }
        return item_ids
    }
    list_results(parent_id){
        var $this = this
        $this.section_manager.showing_id=parent_id
        $this.section_manager.slide_position("results")
        //move to the results panel and list all the items
        // each items visibility is stored in the filter manager - if showing

        var items_showing=$this.section_manager.json_data[parent_id].items_showing
        var data = $this.section_manager.get_match('section_id_'+parent_id)
        var title_col=$this.section_manager.json_data[parent_id]["title_col"]
        $this.sort_data(data,title_col)
    }
    sort_data(data,sort_col){

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
        layer_manager.toggle_layer("section_id_"+_id,"csv_geojson",JSON.parse(this.section_manager.json_data[_id].drawing_info.replaceAll('\n', '')),false,false,item_ids)
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



    //--
     show_results(sorted_data){
         // the sorted data could be a mix of items from multiple sections

         var html= '<ul class="list-group"' +'">'

         for (var i=0;i<sorted_data.length;i++){
            var items_showing = this.section_manager.json_data[sorted_data[i].parent_id].items_showing
            var title_col =  this.section_manager.json_data[sorted_data[i].parent_id].title_col
            var parent_id = sorted_data[i].parent_id
             var showing=""
             if($.inArray( sorted_data[i]._id, items_showing)>-1){
                //check if the item is showing
                showing="checked"
             }
             html += "<li class='list-group-item d-flex justify-content-between list-group-item-action'>"
             if(sorted_data[i]?.feature){
                 html+='<span style="cursor: pointer;" onclick="filter_manager.zoom_item('+parent_id+','+sorted_data[i]._id+')">'+sorted_data[i][title_col]+'</span>'
                 html+='<span><div class="form-check"  onclick="filter_manager.show_items('+parent_id+',['+sorted_data[i]._id+'])"><input class="form-check-input" type="checkbox" '+showing+' value="" id="section_'+parent_id+'_'+sorted_data[i]._id+'" ></div>'
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
}