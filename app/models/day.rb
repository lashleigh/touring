class Day
  include MongoMapper::Document
  #before_save :update_trip_distance
  after_create :do_something_after_create

  key :tags, Hash
  key :distance, Float, :default => 0.0
  key :google_waypoints, Array
  key :encoded_path, String, :default => ''
  key :travel_mode, String, :in => ["DRIVING", "BICYCLING", "WALKING"], :default => "BICYCLING"
  key :stop_location, String, :required => true
  key :stop_coords, Array, :required => true
  key :prev_id, ObjectId
  key :next_id, ObjectId

  belongs_to :trip
  one :locatable
  validates_presence_of :stop_location
  ensure_index [[:stop_coords, '2d']]

  def stop_coords=(x)
    if String === x and !x.blank?
      super(ActiveSupport::JSON.decode(x))
    else
      super(x)
    end
  end
  def google_waypoints=(x)
    if String === x and !x.blank?
      super(ActiveSupport::JSON.decode(x))
    else
      super(x)
    end
  end

  def prev_day
    trip.days.where(:id => prev_id).first if prev_id || false 
  end
  def next_day
    trip.days.where(:id => next_id).first if next_id || false 
  end
  def nearby(radius=25)
    #radius /= 69.0
    box = Geocoder::Calculations::bounding_box(self.stop_coords, radius)
    box = [box[0..1], box[2..3]]
    days = Day.where(:stop_coords => {'$within' => {'$box' => box}}).all
    return days.map{|d| [d.id, Geocoder::Calculations::distance_between(d.stop_coords, self.stop_coords)]}
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
  def to_coordinates
    self.stop_coords
  end
  private
  def do_something_after_create
    prev_d = self.prev_day
    next_d = self.next_day
    if prev_d
      prev_d.next_id = self.id
      prev_d.save
    end
    if next_d
      next_d.prev_id = self.id
      next_d.save
    end
  end
end
