class Warmshowers < Locatable
  include MongoMapper::Document

  :ws_id, String
  :username, String

end
