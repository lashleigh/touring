class Authorization
  include MongoMapper::EmbeddedDocument

  key :uid, String, :required => true
  key :provider, String, :required => true

end
