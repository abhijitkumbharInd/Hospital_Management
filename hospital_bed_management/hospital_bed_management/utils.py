from __future__ import unicode_literals
import frappe

@frappe.whitelist()
def autoname_structure(self, name):
	"""
		This will create a name for documents related to Hospital Structure e.g [Block, Wings, Floor etc]
		The Name will be like : HOSPITALCODE-BLOCKNAME-COUNTER	
	"""
	if not frappe.db.get_values("Hospital Structure", {"parent": self.hospital_name}, "name"):
		frappe.throw("Please add Hospital Structure in <b><a href='desk#Form/Hospital Registration/{0}' style='color:red;'> Hospital Registration </a></b>".format(self.hospital))
	if self.is_new():
		validate_parameter(self.doctype, self.hospital_name)

	total_parameters = [ i.get('name') for i in frappe.db.get_values(self.doctype, {"hospital_name": self.hospital_name}, "name", as_dict=1)]
	hospital_code = frappe.db.get_value("Hospital Registration", {"name": self.hospital_name}, "hospital_code")
	name = hospital_code+"-"+name
	return name

def validate_parameter(doctype, hospital):
	"""
		Used for validation on Hospital Stucture, it wont allow to create bock/wings/floor etc
		beyond the count mentioned in the hospital
	"""
	total_records = len(frappe.db.get_values(doctype, {"hospital_name": hospital}, "name"))+1
	hostpital_strucure = {i.get('parameter'):i.get('count') for i in 
		frappe.get_doc("Hospital Registration", {"name": hospital}).as_dict().get("hospital_stucure")}

	if doctype not in hostpital_strucure:
		frappe.throw("""<b>{0}</b> not present in Hospital Structure, Please update 
			<b><a href='desk#Form/Hospital Registration/{1}' style='color:red;'> Hospital Registration </a></b>""".format(doctype, hospital))

	if total_records > int(hostpital_strucure.get(doctype)):
		frappe.throw("""Not allowed to create <b>{0}</b> the <i>limit is {1}</i> if you wants to add {0} then update 
			the Hospital Structure in <b><a href='desk#Form/Hospital Registration/{2}' style='color:red;'> \
			Hospital Registration </a></b>""".format(doctype, hostpital_strucure.get(doctype), hospital))