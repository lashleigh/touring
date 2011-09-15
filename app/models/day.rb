class Day
  include MongoMapper::Document
  after_create :do_something_after_create
  after_save :update_bounds

  key :tags, Hash
  key :distance, Float
  key :google_waypoints, Array
  key :encoded_path, String
  key :route,        Array,  :typecast => 'Array'
  key :travel_mode, String, :in => ["DRIVING", "BICYCLING", "WALKING"], :default => "BICYCLING"
  key :stop_location, String
  key :stop_coords, Array
  key :bounds, Array
  key :prev_id, ObjectId
  key :next_id, ObjectId

  belongs_to :trip
  one :locatable
  validates_presence_of :stop_location

  def stop_coords=(x)
    if String === x and !x.blank?
      super(ActiveSupport::JSON.decode(x))
    else
      super(x)
    end
  end
  def route=(x)
    if String === x and !x.blank?
      super(ActiveSupport::JSON.decode(x))
    else
      super(x)
    end
  end
  def as_json(options={})
    options[:methods] ||= []
    options[:methods] += [:bounding_box]
    super(options)
  end
 
  def bounding_box(options={})
    options[:radius] ||= 0.25
    Geocoder::Calculations::bounding_box(stop_coords, options[:radius])
  end
  def prev_day
    trip.days.where(:id => prev_id).first if prev_id || false 
  end
  def next_day
    trip.days.where(:id => next_id).first if next_id || false 
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

  def address
    locatable.address if locatable
  end
  def coords
    locatable.coords if locatable
  end
  private
  def do_something_after_create
    prev_d = self.prev_day
    next_d = self.next_day
    if prev_d and next_d
      prev_d.next_id = self.id
      next_d.prev_id = self.id
      prev_d.save
      next_d.save
    elsif prev_d
      prev_d.next_id = self.id
      prev_d.save
    elsif next_d
      next_d.prev_id = self.id
      next_d.save
    end
  end
  def update_bounds
    self.bounds = self.bounding_box
  end
end
