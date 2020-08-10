# -*- coding: utf-8 -*-
# Copyright (c) 2015, Bed Management System and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from datetime import datetime
from datetime import date
import datetime
from frappe.utils import flt, cstr, cint, today
from frappe.model.naming import make_autoname
from frappe import throw, _

class PatientAllotment(Document):
	def validate(self):
		# Maintain Status-wise dates for report purpose
		if self.status == "Recommended" and not self.recommend_date :
			self.recommend_date = today()
		if self.status == "Rejected" and not self.rejected_date :
			self.rejected_date = today()
		if self.status == "Alloted" and not self.alotted_date :
			self.alotted_date = today()
		if self.status == "Discharged" and not self.discharge_date :
			self.discharge_date = today()
		if self.is_new():
			update_bed_status(self.bed, "Not Available")

	def autoname(self):
		year = datetime.datetime.now().strftime("%Y").upper()
		month = datetime.datetime.now().strftime("%m").upper()
		self.name = make_autoname(self.patient_type[:1] + '-' + self.hospital_code[:4]+ '-' + year + '-' + month  + '-'+ '.####')

@frappe.whitelist()		
def update_bed_status(bed_id, status):
	bed_doc = frappe.get_doc("Bed", bed_id)
	bed_doc.status = status
	bed_doc.save()

#Calculate age from birth date
@frappe.whitelist()
def calculate_age(dob):
	curr_day = date.today()
	d = datetime.datetime.strptime(dob, '%Y-%m-%d')
	return curr_day.year - d.year - ((curr_day.month, curr_day.day) < (d.month, d.day))

# Patient recommendation notification
@frappe.whitelist()
def recommended_notification(hospital, p_type, patient_name):
	# check bed avilability
	try:
		if p_type == "Indigent":
			i_bed_aval = frappe.db.get_value("Hospital Registration", hospital, ["i_available"],as_dict=True)
			if i_bed_aval and i_bed_aval['i_available'] <= 0:
				frappe.throw(_("Sorry...Beds are not available for Indigent patients."))
		elif p_type == "Weaker":
			w_bed_aval = frappe.db.get_value("Hospital Registration", hospital, ["w_available"],as_dict=True)
			if w_bed_aval and w_bed_aval['w_available'] <= 0:
				frappe.throw(_("Sorry...Beds are not available for Weaker patients."))
				
		# send notification
		user = frappe.db.sql("""select parent from `tabDefaultValue` where defvalue = '%s' and defkey = 'Hospital Registration' """%(hospital), as_dict=1)
		message = """Dear Sir/Madam, \n \n We are recommanding one '%s' Patient - '%s' to your hospital - '%s'. \n Please check bed availability and proceed. \n \n Thanks. """ %(p_type, patient_name, hospital)
		if user:
			frappe.sendmail(recipients=user[0]['parent'] , content=message, subject='Patient Recommendation Notification')
	except Exception as e:
		pass
	

#Update Hospital and patients information on patient discharge
@frappe.whitelist()
def update_dischaged_info(hospital, p_type, allotment_id,owner,patient_name, bed):
	if p_type == "Indigent":
		i_alloted = frappe.db.get_value("Hospital Registration", hospital, ["i_patient_alloted","i_available"],as_dict=True)
		hosp = frappe.get_doc('Hospital Registration',hospital)
		hosp.i_patient_alloted = i_alloted['i_patient_alloted'] - 1
		hosp.i_available = i_alloted['i_available'] + 1
		hosp.flags.ignore_permissions = 1
		hosp.save()
	elif p_type == "Weaker":
		w_alloted = frappe.db.get_value("Hospital Registration", hospital, ["w_patient_alloted","w_available"],as_dict=True)
		hosp = frappe.get_doc('Hospital Registration',hospital)
		hosp.w_patient_alloted = w_alloted['w_patient_alloted'] - 1
		hosp.w_available = w_alloted['w_available'] + 1
		hosp.flags.ignore_permissions = 1
		hosp.save()
	update_bed_status(bed, "Under Maintenance")
	# Send notification to recommended user on patient discharge
	message = """Dear Sir/Madam, \n \n You have recommended a patient for hospital - '%s'. \n Now patient - '%s' is discharged. \n \n Regards, \n %s """ %(hospital, patient_name, hospital)
	if owner:
		try:
			frappe.sendmail(recipients=owner, content=message, subject='Patient Discharge Notification')
		except Exception as e:
			pass

def get_permission_query_conditions_recommeded(user):
	return recommended_patients(frappe.session.user)

def recommended_patients(user):
	conditions = []
	roles = frappe.get_roles(user)
	for role in roles:
		if role == "Hospital User":
			conditions.append("ifnull(`tabPatient Allotment`.`status`, '')!='Not Verified' or ifnull(`tabPatient Allotment`.`owner`, '')='"+user+"' ")
			return " and ".join(conditions) if conditions else None

def make_bed_available():
	"""
		SCHEDULER: bench execute hospital_bed_management.hospital_bed_management.doctype.patient_allotment.patient_allotment.make_bed_available
	"""
	beds = [i.get('name') for i in frappe.db.get_values("Bed", {"status": "Under Maintenance",\
		"modified":["<", datetime.datetime.now() + datetime.timedelta(days=-1)]}, "name", as_dict=1)]
	for bed in beds:
		update_bed_status(bed, "Available")
