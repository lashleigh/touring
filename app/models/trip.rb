class Trip
  include MongoMapper::Document

  key :title, String
  key :summary, String
  key :tags, Array
  key :distance, Float

  key :start_location, String
  key :start_date, Date
  key :finish_location, String
  key :finish_date, Date
  key :complete, Boolean, :default => false
  timestamps!

  key :user_id, ObjectId
  key :waypoint_ids, Array
  key :day_ids, Array, :default => []
  key :partners, Array

  many :waypoints, :in => :waypoint_ids
  many :days, :in => :day_ids, :dependent => :destroy
  many :users, :in => :partners
  belongs_to :user
  validates_presence_of :title, :user_id, :start_location, :finish_location

  def calc_length
    (days.map {|d| d.length}).sum
  end
end
