class Day
  include MongoMapper::Document
  # Embed this document in trip?
  #after_create :do_something_after_create
  #before_destroy :do_something_before_destroy

  key :tags, Array
  key :distance, Float
  key :google_waypoints, Array
  key :encoded_path, String
  key :travel_mode, String
  #key :end_id, ObjectId
  key :stop_location, String
  key :trip_id, ObjectId

  belongs_to :trip
  validates_presence_of :stop_location, :trip_id, :distance

  def included_waypoints
    #find nearby waypoints
  end

  # This shouldn't have been neccessary
  # but it was not being discovered automatically
  def destination
    Waypoint.find(end_id)
  end
  def to_param
    trip.days.find_index(self).to_s
  end
  def prev_day(options = {})
    if options[:day_index]
      day_by_index(options[:day_index]-1)
    else
      day_by_index(trip.day_ids.index(id)-1)
    end
  end
  def day_by_index(i) 
    if i >= 0 and i < trip.days.length
      trip.days[i]
    else
      false
    end 
  end
  def next_day(options = {})
    if options[:day_index]
      day_by_index(options[:day_index]+1)
    else
      day_by_index(trip.day_ids.index(id)+1)
    end
  end
  def update(params)
    Day.set({:id => id.as_json},
            :distance => params[:distance].to_f,
            :travel_mode => params[:travel_mode],
            :encoded_path => params[:encoded_path],
            :google_waypoints => params[:google_waypoints],
            :stop_location => params[:stop_location])
  end

  private
  def do_something_after_create
    t = Trip.find(trip_id)
    t.day_ids.push(id)
    t.save
  end

  def do_something_before_destroy
    t = Trip.find(trip_id)
    t.day_ids.delete(id)
    t.save
  end
end
