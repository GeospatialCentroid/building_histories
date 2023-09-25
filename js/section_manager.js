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
        console.log(slot)
        $.ajax({
            url: url,
            dataType: type,
            slot: slot,
            success: function(_data) {
                call_back(_data,this.slot)
            }
         });

    }

    parse_data(_data){
        var $this = section_manager
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

          section.filter_manager =  new Filter_Manager({

            group_col:section.group_col,
            image_col:section.image_col,
            path_col:section.path_col,
            show_cols:section.show_cols,
            comma_separated_cols:section.comma_separated_cols,
            title_col:section.title_col,
            year_end_col:section.year_end_col,
            year_start_col:section.year_start_col
//        csv:"https://docs.google.com/spreadsheets/d/e/2PACX-1vQmgyPcmSUv0wrEUCtMFEZIl1rabVGl_fh94hzH4hhONkii-BWIgQvNy0uQzAIfDnU4RfPtSXdJO6UJ/pub?gid=1117849997&single=true&output=csv",
//        omit_result_item:["id","Hex Value for Category (CSV)","Category","lat,lng","Timestamp","Name","Email:"], // define which attributes not to show when a selection is made
//        omit_filter_item:["id","Hex Value for Category (CSV)","lat,lng","Title","Timestamp","Name","Email:","Start date","End date","URL","Description","How this supports NASA's Year of Open Science goals"],
//        path_col:"Link to Project",// the url to the dataset landing page
//        popup_properties:["Title","Institution"],
//        title_col:"Title",
//        sub_title_col:"Institution",
//        location:"lat,lng",
//        date:["Start date","End date"],
//        params:params['f'],
//        comma_separated_col:["Category","Hex Value for Category (CSV)"],
//        color:["Hex Value for Category (CSV)"],
//        category:["Category"]
            })
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
            /// todo Create a filter manager for the data

            //hide loader
            clearInterval($this.progress_interval)
            $("#loader").css("width", 100 + "%")
            setTimeout( function() {

                $(".overlay").fadeOut("slow", function () {
                    $(this).css({display:"none",'background-color':"none"});
                });
            },300);
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

                }
                //console.log("second data",section.data[j].data,section.data[j][1])

            }
          }

    }
    join_geojson(all_data,data_to_join,left_join_col,right_join_col){

        for (var i=0;i<all_data.length;i++){
            var left_join_val=all_data[i][left_join_col]
            for (var j=0;j<data_to_join.features.length;j++){
                //console.log(data_to_join.features[j].properties[right_join_col],"values")
               if(left_join_val == data_to_join.features[j].properties[right_join_col]){

                     for (var p in data_to_join.features[j].properties){
                        // inject all the properties form the geojson
                        all_data[i][p]=data_to_join.features[j].properties[p]
                    }
                    break
               }
            }

        }
    }
}

 


