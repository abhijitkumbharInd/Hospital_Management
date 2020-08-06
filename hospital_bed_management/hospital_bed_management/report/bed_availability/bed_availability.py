# Copyright (c) 2013, Bed Management System and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
import json

def execute(filters=None):
	columns, data = get_coulumns(), get_data(filters)
	return columns, data

def get_coulumns():
	return [
		_("") + ":Data:40",
		_("Hospital") + ":Link/Hospital Registration:300",
		_("Hospital ID") + ":Data:100",
		_("Specialities") + ":Data:150",
		_("Bed ID") + ":Data:280",
		_("Bed Status") + ":Data:150"	
	]

def get_data(filters=None):
	condition = "1=1 "

	if filters.get('Hospital'):
		condition += "and hsp.name = '{0}'".format(filters.get('Hospital'))
	if filters.get('Specialities'):
		condition += "and hsp.specialities = '{0}'".format(filters.get('Specialities'))
	if filters.get('Status'):
		condition += "and bd.status = '{0}'".format(filters.get('Status')	)

	data = frappe.db.sql("""
		select 
			hsp.name as hospital, hsp.hospital_code, hsp.specialities, bd.name as bed_id, bd.status  
		from 
			`tabBed` bd 
		inner join 
			`tabHospital Registration` hsp on bd.hospital_name = hsp.name
		where
			{0}
	""".format(condition), as_dict=1, debug=0)
	data = [["", d.get('hospital'), d.get('hospital_code'), d.get('specialities'), \
		d.get('bed_id'), d.get('status')] for d in data]
	return data