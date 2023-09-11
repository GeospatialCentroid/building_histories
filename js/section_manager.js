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
     var $this = this
     $.ajax({
        type: "GET",
        url: $this.config,
        dataType: "text",
        success: function(data) {
            $this.parse_data(data)
        }
     });
  }
  parse_data(_data){
    this.json_data= $.csv.toObjects(_data.replaceAll('\t', ''))
    console.log(this.json_data)
  }

}
 


