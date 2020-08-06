# -*- coding: utf-8 -*-
# Copyright (c) 2015, Bed Management System and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
import json

class BedCreation(Document):
	pass

@frappe.whitelist()
def get_hospital_structure(hospital):
	hospital_structure = frappe.get_doc("Hospital Registration", hospital).as_dict().hospital_stucure
	if not hospital_structure:
		frappe.throw("Please add Hospital Structure in <b><a href='desk#Form/Hospital Registration/{0}' style='color:red;'> Hospital Profile </a></b>".format(hospital))
	return [i.get('parameter').lower() for i in hospital_structure]

@frappe.whitelist()
def create_beds(doc):
	doc = json.loads(doc)
	bed_name = ""
	bed_prefix = frappe.db.get_value("Hospital Registration", {"name":doc.get('hospital')}, "hospital_code")+"-"

	hospital_structure = get_hospital_structure(doc.get('hospital'))
	current_beds = [i.get('name') for i in frappe.db.get_values("Bed", {"hospital_name":doc.get('hospital')}, "name", as_dict=1)]
	for structure in hospital_structure:
		structure = doc.get(structure).split('-')[-1:][0]
		bed_prefix = bed_prefix + structure + "-"

	bed_prefix = bed_prefix[:-1]
	search_prefix = bed_prefix+'-BED-'	
	existing_bed_list = [i for i in current_beds if search_prefix in i]
	if len(existing_bed_list):
		existing_bed_list.sort()
		current_beds = int(existing_bed_list[-1:][0].split('-')[-1:][0])+1

		for i in range(doc.get('bed')):
			bed_name += bed_prefix +"-BED-"+ str(current_beds)
			update_bed({
				"status": "Available",
				"hospital_name": doc.get('hospital'),
				"name": bed_name.upper()
			})
			bed_name = ""
			current_beds+=1
	else:
		current_beds = 1
		for i in range(doc.get('bed')):
			bed_name += bed_prefix +"-BED-"+ str(current_beds)
			update_bed({
				"status": "Available",
				"hospital_name": doc.get('hospital'),
				"name": bed_name.upper()
			})
			bed_name = ""
			current_beds+=1

	frappe.msgprint("Total <b>{0}</b> beds created in <b>{1}</b> Hospital".format(doc.get('bed'), doc.get('hospital')))

def update_bed(bed_dict):
	bed_doc = frappe.new_doc("Bed")
	bed_doc.update(bed_dict)
	bed_doc.save()

@frappe.whitelist()
def bulk_status_update(status, row_data):
	status = json.loads(status)
	row_data = [row.get("Bed ID") for row in json.loads(row_data)]
	for row in row_data:
		bed_data = frappe.get_doc("Bed", row)
		bed_data.status = status.get('Status')
		bed_data.save()
	frappe.msgprint("Status updated successfully")
	return "success"