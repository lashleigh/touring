require 'test_helper'

class DayTest < ActiveSupport::TestCase
  test "should not save day without stop location" do
    day = Factory.build(:day)
    day.stop_location = nil
    assert !day.save, "Saved the day without a stop location"
  end
  test "should not save day without trip id" do
    day = Factory.build(:day)
    day.trip_id = nil
    assert !day.save, "Saved the day without a trip id"
  end
  test "creating and destroying a day" do
    trip = Factory.build(:trip)
    trip.save
    day = Factory.build(:day)
    day.trip_id = trip.id
    day.save
    trip.reload
    assert_equal day, trip.days.all.last, "the trip day_ids array was not extended"     
    id = day.id
    day.destroy
    trip.reload
    assert !trip.day_ids.include?(id), "the day was not removed from the trips day_ids" 
  end
  test "previous and next day" do
    trip = Factory.build(:trip)
    trip.save
    day_one = Factory.build(:day)
    day_one.trip_id = trip.id
    day_one.save
    day_two = Factory.build(:day)
    day_two.trip_id = trip.id
    day_two.save
    trip.reload
    assert_equal day_two.prev_day, day_one, "the previous day was not correct"     
    assert_equal day_one.next_day, day_two, "The next day was not correct"
    assert_equal day_one.prev_day, false, "There is something before the first day"
    assert_equal day_two.next_day, false, "There is something after the last day"
  end
end
