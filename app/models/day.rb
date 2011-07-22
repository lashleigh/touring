class Day
  include MongoMapper::Document

  key :waypoint_ids, Array
  key :tags, Array
  key :length, Float

  many :waypoints, :class_name => 'Waypoint', :in => :waypoint_ids
end
