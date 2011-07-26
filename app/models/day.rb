class Day
  include MongoMapper::Document
  # Embed this document in trip?

  key :tags, Array
  key :length, Float, :default => 0
  key :google_waypoints, Array
  key :end_id, ObjectId

  belongs_to :trip
  one :waypoint, :in => :end_id

  def included_waypoints
    #find nearby waypoints
  end

  # This shouldn't have been neccessary
  # but it was not being discovered automatically
  def destination
    Waypoint.find(end_id)
  end
  def origin
    #Waypoint.find(trip.days
  end
  def prev_day
    
  end
  def next_day
  end

end
