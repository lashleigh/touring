class Day
  include MongoMapper::Document
  # Embed this document in trip?

  key :tags, Array
  key :distance, Float, :default => 0
  key :google_waypoints, Array
  key :encoded_path, Array
  key :travel_mode, String
  #key :end_id, ObjectId
  key :stop_location, String
  key :trip_id, ObjectId

  belongs_to :trip
  #one :waypoint, :in => :end_id

  def set_index
    Day.set({:id => id.as_json}, 
            :index => trip.day_ids.index(id))
  end

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
  def prev_day(day_index)
    i = day_index-1
    if i >= 0 and i <= trip.days.length
      trip.days[i]
    end
  end
  def next_day(day_index)
    i = day_index+1
    if i >= 0 and i <= trip.days.length
      trip.days[i]
    end
  end
  def update(params)
    Day.set({:id => id.as_json},
            :distance => params[:day][:distance].to_f,
            :travel_mode => params[:day][:travel_mode],
            :encoded_path => params[:day][:encoded_path],
            :google_waypoints => params[:day][:google_waypoints],
            :stop_location => params[:day][:stop_location])
  end
end
