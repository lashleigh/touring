class User
  include MongoMapper::Document

  key :uid, String
  key :token, String
  many :trips
  many :days, :through => :trips

end
