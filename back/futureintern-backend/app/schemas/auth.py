from marshmallow import Schema, fields, validate


class RegisterStudentSchema(Schema):
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=2))
    password = fields.Str(required=True, validate=validate.Length(min=6))
    university = fields.Str(required=False)
    major = fields.Str(required=False)


class RegisterCompanySchema(Schema):
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=2))
    password = fields.Str(required=True, validate=validate.Length(min=6))
    company_name = fields.Str(required=True)
    company_location = fields.Str(required=False)


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)
