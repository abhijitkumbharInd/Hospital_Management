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
		frappe.throw("Please add Hospital Structure in <b><a href='desk#Form/Hospital Registration/{0}' style='color:red;'> Hospital Profile </a></b>".format(self.hospital))
	return [i.get('parameter').lower() for i in hospital_structure]

@frappe.whitelist()
def create_beds(doc):
	doc = json.loads(doc)
	hospital_strucute = get_hospital_structure(doc.get('hospital'))
