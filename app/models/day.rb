class Day
  include MongoMapper::Document
  # Embed this document in trip?

  key :waypoint_ids, Array
  key :tags, Array
  key :length, Float

  many :waypoints, :in => :waypoint_ids
  belongs_to :user
end
