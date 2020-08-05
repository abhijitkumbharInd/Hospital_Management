// Copyright (c) 2016, Bed Management System and contributors
// For license information, please see license.txt

frappe.ui.form.on('Hospital Registration', {
	// make field read only after save
	refresh: function(frm) {
		if (!frm.doc.__islocal){
			frm.set_df_property("total_operational_beds", "read_only", 1);
		}
	},

	validate: function(frm){
		frm.trigger('check_duplicates');		
	},

	//Calculate I and W reserved beds from Percentage
	total_operational_beds: function(frm){
		frappe.call({
			method: "hospital_bed_management.hospital_bed_management.doctype.hospital_registration.hospital_registration.get_reserved_percents",
			args: {},
			callback: function(r) {
				if(r.message) {
					if (r.message[0]!=0 && r.message[1]!=0){
						i_reserved_beds = Math.round(frm.doc.total_operational_beds * r.message[0] / 100)
						w_reserved_beds = Math.round(frm.doc.total_operational_beds * r.message[1] / 100)
						frm.doc.reserved_for_indigent_patients = frm.doc.i_available = i_reserved_beds
						frm.doc.reserved_for_weaker_patients = frm.doc.w_available = w_reserved_beds
						refresh_field('reserved_for_indigent_patients')
						refresh_field('reserved_for_weaker_patients')
					}
					else{
						frappe.throw(__("Please set Reserved percentge for I and W patients through System Settings"));
					}
				}
			}
		});
	},

	check_duplicates(frm){
		table_data = frm.doc.hospital_stucure
		console.log("table_data", table_data)
		item_list = []
		forEach(table_data, function(e){
			item_list.push(e['parameter'])
		})
		item_list_set = new Set(item_list)
		if (item_list.length != [...item_list_set].length){
			frappe.throw("Duplicate parameters not allowed in Hospital Structure")
		}
	}
});
