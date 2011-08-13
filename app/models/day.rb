class Day
  include MongoMapper::Document
  # Embed this document in trip?
  after_create :do_something_after_create
  before_destroy :do_something_before_destroy

  key :tags, Hash
  key :distance, Float
  key :google_waypoints, Array
  key :encoded_path, String
  key :travel_mode, String
  #key :end_id, ObjectId
  key :stop_location, String
  key :trip_id, ObjectId

  belongs_to :trip
  validates_presence_of :stop_location, :trip_id, :distance

  def tag_names
    tags.map{|k,v| v == 1 ? Tag.find(k).name : Tag.find(k).name + "x"+v.to_s}
  end

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
  def custom_update(params)
    Day.set({:id => id.as_json},
            :distance => params[:distance].to_f,
            :travel_mode => params[:travel_mode],
            :encoded_path => params[:encoded_path],
            :google_waypoints => params[:google_waypoints],
            :stop_location => params[:stop_location])
  end
  def show_distance(unit_system)
    if unit_system == "METRIC"
      toKilometers(distance) + " km"
    else 
      toMiles(distance) + " mi"
    end
  end
  def toMiles(num)
    ((num / 1000) * 0.621371192).round(1).to_s;
  end
  def toKilometers(num)
    (num / 1000).round(1).to_s;
  end

  def parse_tag_string(tag_string)
    tag_array = tag_string.scan(/(\w+)|("([^"]+)")|('([^']+)')/).map { |a, _, b, _, c| (a or b or c).strip }
    r1 = Regexp.new('...x\d+$')
    res = {}
    tag_array.each do |t|
      if r1.match(t) 
        match_array = r1.match(t).string.rpartition("x")
        tag = Tag.find_or_create_by_name(match_array[0].downcase)
        #tag.count += match_array[2].to_i
        #tag.save
        res[tag.id] = match_array[2]
      else
        tag = Tag.find_or_create_by_name(t.downcase)
        #tag.count += 1
        #tag.save
        res[tag.id] = 1
      end
    end
    #res.merge!(tags){|k, old, new| old+new}
    Day.set({:id => id.as_json}, :tags => res.merge(tags){|k, old, new| old+new}.as_json)
    return res.map{|k,v| v == 1 ? Tag.find(k).name : Tag.find(k).name + "x"+v.to_s}
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
