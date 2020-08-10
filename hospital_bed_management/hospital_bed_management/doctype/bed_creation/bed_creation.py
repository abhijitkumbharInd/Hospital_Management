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
	existing_bed_list = [i for i in current_beds if search_prefix.upper() in i]
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

def search_bed(doctype, txt, searchfield, start, page_len, filters):
	search_pattern = ""
	search_keys = all_beds = all_beds_ = []

	hospital_code = frappe.db.get_value("Hospital Registration", {"name": filters.get('hospital_name')}, ["hospital_code"])
	hospital_structure = get_hospital_structure(filters.get('hospital_name'))
	for i in hospital_structure:
		search_keys.append(filters.get(i).replace(hospital_code, '').upper()) if filters.get(i) else ''
	all_beds_ = [bed.get('name') for bed in frappe.db.get_values("Bed", {"hospital_name": filters.get('hospital_name'),\
	 "status": "Available"}, "name", as_dict=1)]
	searched_beds = [[i] for i in all_beds_ if len([s for s in search_keys if s in i]) == len(search_keys)]
	
	return tuple(searched_beds) if len(search_keys) else [[i] for i in all_beds_]

@frappe.whitelist()	
def get_bed_location(bed_id, hospital):
	table_data = columns = row = ""
	hospital_structure = get_hospital_structure(hospital)
	bed_id = bed_id.split('-')
	bed_id = bed_id[1:-2]
	columns = "".join(['<td>{0}</td>'.format(i.upper()) for i in hospital_structure])
	row = "".join(['<td>{0}</td>'.format(i.upper()) for i in bed_id])
	table_data = """
		<table class='table table-bordered'>
			<tr>{0}</tr>
			<tr>{1}</tr>
		</table>""".format(columns, row)
	return table_data