from marshmallow import Schema, fields, validate


class InternshipSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=3))
    description = fields.Str(required=True, validate=validate.Length(min=10))
    requirements = fields.Str(required=False)
    location = fields.Str(required=False)
    duration = fields.Str(required=False)
    stipend = fields.Str(required=False)
    application_deadline = fields.Date(required=False)
    start_date = fields.Date(required=False)
