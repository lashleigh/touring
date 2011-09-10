class Day
  include MongoMapper::Document
  # Embed this document in trip?
#  after_create :do_something_after_create
#  before_destroy :do_something_before_destroy

  key :tags, Hash
  key :distance, Float
  key :google_waypoints, Array
  key :encoded_path, String
  key :travel_mode, String
  #key :end_id, ObjectId
  key :stop_location, String
  key :stop_coords, Array
  key :prev_id, ObjectId
  key :next_id, ObjectId

  belongs_to :trip
  validates_presence_of :stop_location
  def stop_coords=(x)
    if String === x and !x.blank?
      super(ActiveSupport::JSON.decode(x))
    else
      super(x)
    end
  end

  def prev_day
    Day.find(prev_id) || false
  end
  def next_day
    Day.find(next_id) || false
  end
  def self.find_all_by_tag(tag)
    Day.where("tags.#{tag}" => {'$exists' => true}).all
  end

  def self.find_all_by_tag_and_minimum_count(tag, count)
    # ex Day.by_tag_and_minimum_count("roadkill", "2")
    # Without quotes around the count it doesn't work
    Day.where("tags.#{tag}" => {'$gt' => count}).all
  end
  
  def tag_names
    tags.map{|k,v| v == 1 ? k : k + "x"+v.to_s}
  end

  def alt_tag_hash
    all_tags = {}
    tags.each                {|k,v| all_tags[k] ||= {"day" => 0, "trip" => 0, "user" => 0}; all_tags[k]["day"]  = v}
    trip.trip_day_tags.each  {|k,v| all_tags[k] ||= {"day" => 0, "trip" => 0, "user" => 0}; all_tags[k]["trip"] = v}
    trip.user.user_tags.each {|k,v| all_tags[k] ||= {"day" => 0, "trip" => 0, "user" => 0}; all_tags[k]["user"] = v}
    return all_tags.sort
  end

  def tag_hash
    all_tags =  {}
    t_tags = trip.trip_day_tags
    u_tags = trip.user.user_tags
    all_tags["tags_for_this_day"] = tags
    all_tags["other_tags_from_this_trip"] = t_tags.delete_if {|k,v| tags.has_key? k}
    all_tags["tags_from_other_trips"] = u_tags.delete_if {|k,v| tags.has_key? k or t_tags.has_key? k}
    return all_tags  
  end

  def included_waypoints
    #find nearby waypoints
  end

  # This shouldn't have been neccessary
  # but it was not being discovered automatically
  def destination
    Waypoint.find(end_id)
  end
  def prev_day_old
    id = trip.days.index(self)
    day_by_index(id-1)
  end
  def day_by_index(i) 
    if i >= 0 and i < trip.days.length
      trip.days[i]
    else
      false
    end 
  end
  def next_day_old
    id = trip.days.index(self)
    day_by_index(id+1)
  end
  def custom_update(params)
    Day.set({:id => id.as_json},
            :distance => params[:distance].to_f,
            :travel_mode => params[:travel_mode],
            :encoded_path => params[:encoded_path],
            :google_waypoints => params[:google_waypoints],
            :stop_location => params[:stop_location])
  end
  def show_distance(options={})
    options[:unit_system] ||= "METRIC"
    if options[:unit_system] == "METRIC"
      self.toKilometers + " km"
    else 
      self.toMiles + " mi"
    end
  end
  def toMiles
    ((distance/ 1000) * 0.621371192).round(1).to_s
  end
  def toKilometers
    (distance / 1000).round(1).to_s
  end

  def parse_tag_string(tag_string)
    tag_array = tag_string.scan(/(\w+)|("([^"]+)")|('([^']+)')/).map { |a, _, b, _, c| (a or b or c).strip }
    r1 = Regexp.new('...x\d+$')
    res = {}
    tag_array.each do |t|
      if r1.match(t) 
        match_array = r1.match(t).string.rpartition("x")
        res[match_array[0]] = match_array[2]
      else
        res[t] = 1
      end
    end
    #res.merge!(tags){|k, old, new| old+new}
    Day.set({:id => id.as_json}, :tags => res.merge(tags){|k, old, new| old+new}.as_json)
    return res.map{|k,v| v == 1 ? k : k + "x"+v.to_s}
  end

  def geocode
    self.stop_coords = Geocoder.coordinates(stop_location)
  end
  private
  def do_something_after_create
    t = self.trip
    t.days.push(id)
    t.save
  end

  def do_something_before_destroy
    t = self.trip
    t.days.delete(self)
    t.save
  end
end
