// Copyright (c) 2016, Bed Management System and contributors
// For license information, please see license.txt

frappe.ui.form.on('Bed Creation', {
	refresh: function(frm) {
		frm.disable_save()
		frm.set_value("hospital", "");
		frm.trigger('clear_fields');
		frm.events.toggle_hide_fields(frm, ["block", "building", "wing", "floor", "room", "partition"], 1)
		frm.add_custom_button(__('Create Beds'), function () {
			frappe.call({
				method: "hospital_bed_management.hospital_bed_management.doctype.bed_creation.bed_creation.create_beds",
				args: {
					"doc": frm.doc
				},
				callback: function(r) {
					if(r.message) {
						
					}
				}
			});
		});
	},

	clear_fields: function(frm){
		frm.set_value("block", "");
		frm.set_value("building", "");
		frm.set_value("wing", "");
		frm.set_value("floor", "");
		frm.set_value("room", "");
		frm.set_value("partition", "");
		frm.set_value("bed", "");
	},

	toggle_hide_fields: function(frm, field_list, option){
		field_list.forEach(function(e){
			frm.set_df_property(e, "read_only", option);
		})
		refresh_many(field_list);
	},

	hospital: function(frm){
		frm.trigger('clear_fields');
		frm.events.toggle_hide_fields(frm, ["block", "building", "wing", "floor", "room", "partition"], 1)
		if (frm.doc.hospital){
			frappe.call({
				method: "hospital_bed_management.hospital_bed_management.doctype.bed_creation.bed_creation.get_hospital_structure",
				args: {
					"hospital": frm.doc.hospital
				},
				async: false,
				callback: function(r) {
					if(r.message) {
						frm.events.toggle_hide_fields(frm, r.message, 0)
					}
				}
			});
		}
	}
});

cur_frm.fields_dict['block'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital}
	}
}

cur_frm.fields_dict['building'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital}
	}
}

cur_frm.fields_dict['wing'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital}
	}
}

cur_frm.fields_dict['floor'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital}
	}
}

cur_frm.fields_dict['room'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital}
	}
}

cur_frm.fields_dict['building'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital}
	}
}

cur_frm.fields_dict['partition'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital}
	}
}