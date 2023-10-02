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

   }
     init_search_interface(json_data){
        //  called from section manager
        var $this=this
        this.populate_search(json_data)
        $('#list_sort').change(function() {
           $this.list_results($this.showing_id)
        });



        $("#search").focus();
        $("#search_clear").click(function(){
            $("#search").val("")
        })
        ///--------
        $('input[type=radio][name=search_type]').change(function() {
            $this.mode=this.value
        });
        //When searching - all titles are added to the auto
         $("#search_but").click(function(){
            if($this.mode=="data"){
                console.log("search the data")
               //$this.add_filter(false,[$("#search").val()])
               $this.filter();
               //go to results
               $this.slide_position("results")
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
        console.log(this.subset)
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
    show_results(search_str){
        console.log("show the results",search_str)

    }
}