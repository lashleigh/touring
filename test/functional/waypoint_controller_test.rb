require 'test_helper'

class WaypointControllerTest < ActionController::TestCase
  test "should get venue_id:string" do
    get :venue_id:string
    assert_response :success
  end

  test "should get name:string" do
    get :name:string
    assert_response :success
  end

  test "should get city:string" do
    get :city:string
    assert_response :success
  end

  test "should get address:string" do
    get :address:string
    assert_response :success
  end

  test "should get country:string" do
    get :country:string
    assert_response :success
  end

  test "should get coords:array" do
    get :coords:array
    assert_response :success
  end

  test "should get postal:integer" do
    get :postal:integer
    assert_response :success
  end

  test "should get state:string" do
    get :state:string
    assert_response :success
  end

  test "should get categories:array" do
    get :categories:array
    assert_response :success
  end

  test "should get amenities:array" do
    get :amenities:array
    assert_response :success
  end

  test "should get voters:array" do
    get :voters:array
    assert_response :success
  end

  test "should get num_votes:integer" do
    get :num_votes:integer
    assert_response :success
  end

  test "should get rating:float" do
    get :rating:float
    assert_response :success
  end

end
