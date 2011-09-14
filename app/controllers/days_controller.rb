class DaysController < ApplicationController
  # GET /days
  # GET /days.xml
  before_filter :require_user, :except => [:index, :show]
  def add_tag
    day = Day.find_by_id(params[:tags_day_id])
    newtags = day.parse_tag_string(params[:tag_string])
    day.reload
    render :json => newtags 
  end
  def index
    @trip = Trip.find(params[:trip_id])
    @days = @trip.days

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @days }
    end
  end

  # GET /days/1
  # GET /days/1.xml
  def show
    @trip = Trip.find(params[:trip_id])
    @day = Day.find(params[:id])
    @unit_system = current_user ? current_user.unit_system : "IMPERIAL" 

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @day }
    end
  end

  # GET /days/new
  # GET /days/new.xml
  def new
    @trip = Trip.find(params[:trip_id])
    @prev_day = @trip.days[-1]
    @day = Day.new

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @day }
    end
  end

  # GET /days/1/edit
  def edit
    @trip = Trip.find(params[:trip_id])
    @day = Day.new(params[:day])  
  end

  def update_from_index
    @day = Day.find(params[:id])
    @trip = Trip.find(params[:trip][:id])
    @day.assign(params[:day])

    if @day.save
      dayhtml = render_to_string :partial => 'day', :collection => @trip.ordered_days
      render :json => {'trip' => @trip, 'day' => @day, 'dayhtml' => dayhtml}
    else
      render :json => {'status' => 'faliure'}
    end
  end

  def index_edit
    @day = Day.find(params[:id])
    @trip = Trip.find(params[:trip][:id])
    @day.assign(params[:day])
    if @day.next_id
      next_day = @day.next_day
      next_day.assign(params[:next_day])
      next_day.save
    end

    if @day.save
      dayhtml = render_to_string :partial => 'day', :collection => @trip.ordered_days
      render :json => {'trip' => @trip, 'day' => @day, 'next_day' => @day.next_day, 'dayhtml' => dayhtml}
    else
      render :json => {'status' => 'faliure'}
    end
  end


  def create_new_day
    @day = Day.new(params[:day])
    @trip = Trip.find(params[:trip][:id])
    @day.trip = @trip
    next_day = Day.find(params[:next_day][:id])
    if next_day
      next_day.assign(params[:next_day])
      next_day.prev_id = @day.id
      next_day.save
    end

    if @day.save
      @trip.reload
      dayhtml = render_to_string :partial => 'day', :collection => @trip.ordered_days
      render :json => {'trip' => @trip, 'day' => @day, 'next_day' => @day.next_day, 'dayhtml' => dayhtml}
    else
      render :json => {'status' => 'faliure'}
    end
  end

  # PUT /days/1
  # PUT /days/1.xml
  def update
    @trip = Trip.find(params[:trip_id])
    @day = Day.find(params[:id])
    @day.assign(params[:day])
    
    respond_to do |format|
      if @day.save
        format.html { redirect_to(trip_day_path(@trip, @day), :notice => 'Day was successfully updated.') }
        format.xml  { head :ok }
      else
        format.html { redirect_to(edit_trip_day_path(@trip, @day)) }
        format.xml  { render :xml => @day.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /days/1
  # DELETE /days/1.xml
  def destroy
    @trip = Trip.find(params[:trip_id])
    @day = Day.find(params[:id])
    prev_d = @day.prev_day
    next_d = @day.next_day
    if prev_d and next_d
      prev_d.next_id = next_d.id
      next_d.prev_id = prev_d.id
      next_d.distance += @day.distance
    elsif prev_d
      prev_d.next_id = nil
    elsif next_d
      next_d.prev_id = nil
      next_d.distance += @day.distance
      # next_d.route = @day.route + next_d.route
      # next_d.waypoints.push(@day.waypoints)
    end

    respond_to do |format|
      if user_can_modify(@trip) and @day.destroy
        prev_d.save if prev_d
        next_d.save if next_d
        format.html { redirect_to(trip_days_path) }
        format.xml  { head :ok }
      else
        flash[:error] = "It appears you attempted to delete a suggestion that you did not create. Perhaps you need to log in?"
        format.html { redirect_to root_path }
        format.xml  { head :ok }
      end
    end
  end

  private 
  def user_can_modify(trip)
    trip.user == @current_user || (@current_user and @current_user.admin?)
  end

end
