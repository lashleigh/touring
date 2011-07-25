class Trip
  include MongoMapper::Document

  key :title, String
  key :summary, String
  key :tags, Array
  key :distance, Integer
  key :departure, Time
  key :finish, Time
  key :complete, Boolean, :default => false
  timestamps!

  key :user_id, ObjectId
  key :day_ids, Array
  key :partners, Array

  many :days, :in => :day_ids
  many :users, :in => :partners
  belongs_to :user
  validates_presence_of :title, :user_id

end
