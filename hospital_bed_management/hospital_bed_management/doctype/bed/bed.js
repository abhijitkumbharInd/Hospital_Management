// Copyright (c) 2016, Bed Management System and contributors
// For license information, please see license.txt

frappe.ui.form.on('Bed', {
	refresh: function(frm) {
		frm.disable_save()
	}
});
