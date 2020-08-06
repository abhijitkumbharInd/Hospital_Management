// Copyright (c) 2016, Bed Management System and contributors
// For license information, please see license.txt

function set_filters_by_name(){
	frappe.query_report_filters_by_name = {};
	for(var i in this.filters) {
		frappe.query_report_filters_by_name[this.filters[i].df.fieldname] = this.filters[i];
	}
}

set_filters_by_name()

var filter_list = [
	{
		"fieldname":"select_all",
		"label": __("Select All"),
		"fieldtype": "Check",
		"default":1
	},
	{
		"fieldname":"Hospital",
		"label": __("Hospital"),
		"fieldtype": "Link",
		"options": "Hospital Registration",
	},
	{
		"fieldname":"Specialities",
		"label": __("Specialities"),
		"fieldtype": "Link",
		"options": "Specialities",
	},
	{
		"fieldname":"Status",
		"label": __("Status"),
		"fieldtype": "Select",
		"options": ["","Available","Under Maintenance","Not operational","Broken","Transferred","Not Available"],
	}
]

var row_selection_dict = undefined;


frappe.query_reports["Bed Availability"] = {
    "filters":filter_list,
    formatter: function(row, cell, value, columnDef, dataContext,default_formatter) {
		var me = frappe.container.page.query_report;
		var select_all = frappe.query_report.filters_by_name.select_all.get_value()
		if (columnDef.df.label=="") {
			me.data[row].selected
				= select_all ? true : false;

			return repl("<input type='checkbox' \
				data-row='%(row)s' %(checked)s>", {
					row: row,
					checked: select_all ? "checked=\"checked\"" : ""
				});
			}
		value = default_formatter(row, cell, value, columnDef, dataContext);

		if (columnDef.id == "Bed Status"){
               if (value == "Available"){
                    value = "<span style='color:green!important;font-weight:bold'>" + value + "</span>";
               }else if(value == "Not Available"){
                    value = "<span style='color:red!important;font-weight:bold'>" + value + "</span>";
               }else if(value == "Under Maintenance"){
                    value = "<span style='color:orange!important;font-weight:bold'>" + value + "</span>";
               }
               else {
                    value = "<span style='color:black!important;font-weight:bold'>" + value + "</span>";
               }
        }


		return value
	},

    onload: function(report) {
    	frappe.query_reports["Bed Availability"].report_operation(report)
    },

    report_operation: function(report) {
    	var me = frappe.container.page.query_report;

    	$('body').on("click", "input[type='checkbox'][data-row]", function() {
			me.data[$(this).attr('data-row')].selected
					= this.checked ? true : false;
		})

        report.page.add_inner_button(__("Update status"), function() {
        	frappe.selected_rows = []
			$.each(me.data,function(i,d){
				if (d.selected == true){
					frappe.selected_rows.push(d)
				}
			})
            frappe.query_reports["Bed Availability"].make_dialog(report)
        });
    },

    make_dialog: function(report){
    	var status_update_dialog = new frappe.ui.Dialog({
		title: __("Bulk Status Update"),
		fields: [{
				"fieldname":"Status",
				"label": __("Status"),
				"fieldtype": "Select",
				"options": ["","Available","Under Maintenance","Not operational","Broken","Transferred","Not Available"],
			}]
		});
		status_update_dialog.show()
		status_update_dialog.set_primary_action(__("Update"), function() {
			status_update_dialog.hide()
			frappe.call({
				method:"hospital_bed_management.hospital_bed_management.doctype.bed_creation.bed_creation.bulk_status_update",
				args : {
					"status"  : status_update_dialog.get_values(),
					"row_data": frappe.selected_rows
				},
				freeze: true,
				freeze_message: __("Updating status ... Please Wait"),
				callback : function(r){
					if (r.message == "success"){
						report.trigger_refresh();
					}
				}
			})
		})
    }
 }