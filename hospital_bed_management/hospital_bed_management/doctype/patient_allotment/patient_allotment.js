// Copyright (c) 2016, Bed Management System and contributors
// For license information, please see license.txt

frappe.ui.form.on('Patient Allotment', {
	onload: function(frm) {
		if(in_list(user_roles, "Hospital User")){
			set_field_permlevel('recommend',2);
		}
	},

	// Add Recommend and Discharge buttons
	refresh: function(frm){
		if(!frm.doc.__islocal && frm.doc.status=="Not Verified" ){
			cur_frm.add_custom_button(__('Recommend'), function() { cur_frm.events.recommend(); }, 'icon-retweet', 'btn-default');
		}
		if(!frm.doc.__islocal && frm.doc.status=="Alloted"){
			if(in_list(user_roles, "Hospital User")){
				cur_frm.add_custom_button(__('Discharge'), function() { cur_frm.events.update_info(); }, 'icon-retweet', 'btn-default discharge');
			}
		}
		if(!(frm.doc.__islocal) && !(frm.doc.status=="Not Verified")){
			setTimeout(function() { cur_frm.events.table_readonly()}, 1000);
		}
		if (frm.doc.__islocal) {
			frm.trigger('clear_fields');
			frm.trigger('hospital_name');
			$(frm.fields_dict["bed_location_details"].wrapper).html("")
		}else{
			frm.trigger('get_bed_location')
		}
		if(frm.doc.status == "Alloted"){
			frm.events.toggle_hide_fields(frm, ["block", "building", "wing", "floor", "room", "partition", "clear_all"], 1)
			frm.set_df_property('bed', 'read_only', 1);
		}
	},

	table_readonly: function(frm){
		cur_frm.get_field("income_document").grid.docfields[0].read_only = 1;
		cur_frm.get_field("income_document").grid.docfields[1].read_only = 1;
		cur_frm.get_field("income_document").grid.docfields[2].read_only = 1;
		cur_frm.get_field("income_document").grid.docfields[3].read_only = 1;
		cur_frm.get_field("income_document").grid.docfields[4].read_only = 1;
		cur_frm.set_df_property("income_document", "read_only", 1);
	},

	// Calculate patient age from DOB
	patient_dob: function(frm){
		frappe.call({
			method: "hospital_bed_management.hospital_bed_management.doctype.patient_allotment.patient_allotment.calculate_age",
			args: {"dob": frm.doc.patient_dob},
			callback: function(r) {
				if(r.message) {
					if (r.message){
						frm.doc.patient_age = r.message
						refresh_field('patient_age')
					}
				}
			}
		});
	},

	// remove patient DOB on entering age directly
	patient_age: function(frm){
		frm.doc.patient_dob = ""
		refresh_field('patient_dob')
	},

	// Update patient status on recommendation
	recommend: function(frm,cdt,cdn){
		var count = files = 0
		// if(!(cur_frm.doc["income_document"]).length){
		// 	frappe.throw(__("Please upload Income Verification Documents first for Recommendation..."));
		// }

		// Removed below code in requirement Ticket ID: #9056

		// if((cur_frm.doc["income_document"]).length < 2){
		// 	frappe.throw(__("Please upload at least 2 Income Verification Documents for Recommendation..."));
		// }
		$.each(cur_frm.doc["income_document"] || [], function(i, d) {
			if(d.verified_against_income==1){
				count = count + 1
			}
			if(d.attach_file){
				files = files + 1
			}
		});
	 	if((cur_frm.doc["income_document"]).length==files){
	 		if((cur_frm.doc["income_document"]).length==count){
		 		frappe.call({
					method: "hospital_bed_management.hospital_bed_management.doctype.patient_allotment.patient_allotment.recommended_notification",
					args: {
						"hospital": cur_frm.doc.hospital_name,
						"p_type": cur_frm.doc.patient_type,
						"patient_name": cur_frm.doc.patient_name
					},
					freeze: true,
					freeze_message: __("Notification Sending..."),
					callback: function(r) {
						cur_frm.doc.status = "Recommended"
				 		refresh_field('status')
				 		cur_frm.save();
				 		if (in_list(user_roles, "Hospital User")){
				 			frappe.set_route("patient-allot-reject");
				 			msgprint("Recommendation Successfully Done.!!!")
				 		}
				 		else if(in_list(user_roles, "Municipal Officers") || in_list(user_roles, "Social Workers")){
				 			frappe.set_route("List", "Patient Allotment");
				 			msgprint("Recommendation Successfully Done.!!!")
				 		}
				 		// frappe.set_route("hospital-search", "Hospital Bed Management");
					}
				});
	 		}
	 		else{
		 		frappe.throw(__("Documents are not verified for Recommendation..."));
		 	}
	 	}
	 	else{
	 		frappe.throw(__("Document attachment is mandatory for Recommendation..."));
	 	}
	},

	// Update bed info and patient info on discherged
	update_info: function(frm,cdt,cdn){
		// cur_frm.toggle_enable(['discharge'], false);
		frappe.call({
			method: "hospital_bed_management.hospital_bed_management.doctype.patient_allotment.patient_allotment.update_dischaged_info",
			args: {
				"hospital"		: cur_frm.doc.hospital_name,
				"p_type"		: cur_frm.doc.patient_type,
				"allotment_id"	: cur_frm.doc.name,
				"owner"			: cur_frm.doc.owner,
				"patient_name"	: cur_frm.doc.patient_name,
				"bed"			: cur_frm.doc.bed
			},
			freeze: true,
			freeze_message: __("Notification Sending..."),
			callback: function(r) {
				cur_frm.doc.status = "Discharged"
		 		refresh_field('status')
		 		cur_frm.doc.discharge = 1
		 		refresh_field('discharge')
		 		cur_frm.save();
		 		msgprint("Patient Discharged Successfully.Also updated discharge information.!!!")
			}
		});
	},

	// add validation annual_income
	validate: function(frm){
		if(frm.doc.patient_dob >= frappe.datetime.get_today()){
			msgprint("Patient DOB should not be future date")
			validated = false
		}
		// if(frm.doc.annual_income <=0){
		// 	msgprint("Annual Income should be greater then 0")
		// 	validated = false
		// }
	},

	hospital_name: function(frm){
		frm.trigger('clear_fields');
		frm.events.toggle_hide_fields(frm, ["block", "building", "wing", "floor", "room", "partition"], 1)
		if (frm.doc.hospital_name){
			frappe.call({
				method: "hospital_bed_management.hospital_bed_management.doctype.bed_creation.bed_creation.get_hospital_structure",
				args: {
					"hospital": frm.doc.hospital_name
				},
				async: false,
				callback: function(r) {
					if(r.message) {
						frm.events.toggle_hide_fields(frm, r.message, 0)
					}
				}
			});
		}
	},

	toggle_hide_fields: function(frm, field_list, option){
		field_list.forEach(function(e){
			frm.set_df_property(e, "read_only", option);
			frm.refresh_field(e)
		})
		refresh_many(field_list);
	},

	toggle_mandatory_fields: function(frm, field_list, option){
		field_list.forEach(function(e){
			frm.set_df_property(e, "reqd", option);
			frm.refresh_field(e)
		})
		refresh_many(field_list);
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

	clear_all: function(frm){
		frm.trigger('clear_fields');
	},

	get_bed_location(frm){
		frappe.call({
			method: "hospital_bed_management.hospital_bed_management.doctype.bed_creation.bed_creation.get_bed_location",
			args: {
				"bed_id": frm.doc.bed,
				"hospital": frm.doc.hospital_name
			},
			async: false,
			callback: function(r) {
				if(r.message) {
					$(frm.fields_dict["bed_location_details"].wrapper).html(r.message)
					refresh_field("bed_location_details")
				}
			}
		});
		
	}
});

cur_frm.fields_dict['block'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital_name}
	}
}

cur_frm.fields_dict['building'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital_name}
	}
}

cur_frm.fields_dict['wing'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital_name}
	}
}

cur_frm.fields_dict['floor'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital_name}
	}
}

cur_frm.fields_dict['room'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital_name}
	}
}

cur_frm.fields_dict['partition'].get_query = function(doc) {
	return {
		filters: {"hospital_name": cur_frm.doc.hospital_name}
	}
}

cur_frm.fields_dict['bed'].get_query = function(doc) {
	return {
		"query": "hospital_bed_management.hospital_bed_management.doctype.bed_creation.bed_creation.search_bed",
		"filters": {
			"hospital_name": cur_frm.doc.hospital_name,
			"block"		   : cur_frm.doc.block,
			"building"	   : cur_frm.doc.building,
			"wing"		   : cur_frm.doc.wing,
			"floor" 	   : cur_frm.doc.floor,
			"room" 		   : cur_frm.doc.room,
			"partition"	   : cur_frm.doc.partition
		}
	}
}