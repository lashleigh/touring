class DaysController < ApplicationController
  # GET /days
  # GET /days.xml
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
    day_index = params[:id].to_i
    @day = @trip.days[day_index]
    @prev_day = @day.prev_day(:day_index => day_index)
    @next_day = @day.next_day(:day_index => day_index)

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
    @day = @trip.days[params[:id].to_i]
  end

  # POST /days
  # POST /days.xml
  def create
    @trip = Trip.find(params[:trip_id])
    @day = Day.new(params[:day])  
    @day.trip_id = @trip.id
    @day.save

    redirect_to("/trips/#{params[:trip_id]}/days/#{params[:id]}")
    #respond_to do |format|
    #  if @day.save
    #    format.html { redirect_to(custom_trip_day(@trip,@day), :notice => 'Day was successfully created.') }
    #    format.xml  { render :xml => @day, :status => :created, :location => @day }
    #  else
    #    format.html { render :action => "new" }
    #    format.xml  { render :xml => @day.errors, :status => :unprocessable_entity }
    #  end
    #end
  end

  # PUT /days/1
  # PUT /days/1.xml
  def update
    @trip = Trip.find(params[:trip_id])
    @day = @trip.days[params[:id].to_i]
    @day.update(params)
    redirect_to("/trips/#{params[:trip_id]}/days/#{params[:id]}")
    
    #respond_to do |format|
    #  if @day.update_attributes(params[:day])
    #    format.html { redirect_to("/trips/#{@trip.id}/days/#{params[:id]}", :notice => 'Day was successfully updated.') }
    #    format.xml  { head :ok }
    #  else
    #    format.html { redirect_to(edit_trip_day_path(@trip, @day)) }
    #    format.xml  { render :xml => @day.errors, :status => :unprocessable_entity }
    #  end
    #end
  end

  # DELETE /days/1
  # DELETE /days/1.xml
  def destroy
    @trip = Trip.find(params[:trip_id])
    @day = @trip.days[params[:id].to_i]
    @day.destroy
    #@trip.day_ids.delete(@day.id)
    #@trip.save

    respond_to do |format|
      # This redirect is a bad hack but trips_day_path tries to redirect to something that doesn't exist.
      format.html { redirect_to("/trips/#{@trip.id}/days") }
      format.xml  { head :ok }
    end
  end
end
