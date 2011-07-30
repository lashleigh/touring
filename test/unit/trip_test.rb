require 'test_helper'

class TripTest < ActiveSupport::TestCase
  test "should not save trip without title" do
    trip = Factory.build(:trip)
    assert trip.save, "was not a valid trip"
    trip.title = nil
    assert !trip.save, "able to save without title"
  end
  test "should not save trip without user id" do
    trip = Factory.build(:trip)
    assert trip.save, "was not a valid trip"
    trip.user_id = nil
    assert !trip.save, "able to save without user id"
  end
  test "should not save trip without start location" do
    trip = Factory.build(:trip)
    assert trip.save, "was not a valid trip"
    trip.start_location = nil
    assert !trip.save, "able to save without a start location"
  end
end
