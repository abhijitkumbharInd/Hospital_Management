# -*- coding: utf-8 -*-
# Copyright (c) 2015, Bed Management System and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from hospital_bed_management.hospital_bed_management.utils import autoname_structure

class Building(Document):
	def validate(self):
		self.name = autoname_structure(self, self.building_name)
