require 'test_helper'

class TripTest < ActiveSupport::TestCase
  test "should not save trip without title" do
    trip = Factory.build(:trip)
    trip.title = nil
    assert !trip.save
  end
  test "should not save trip without user id" do
    trip = Factory.build(:trip)
    trip.user_id = nil
    assert !trip.save
  end
  test "should not save trip without start location" do
    trip = Factory.build(:trip)
    trip.start_location = nil
    assert !trip.save
  end
end
